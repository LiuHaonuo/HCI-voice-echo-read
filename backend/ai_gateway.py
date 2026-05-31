import os
import sys

# 清除可能影响网络请求的代理环境变量
for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy', 'GITHUB_TOKEN', 'GITHUB_ACTOR']:
    os.environ.pop(var, None)

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import requests

app = Flask(__name__)
CORS(app)

config = {
    "deepseek": {
        "api_key": os.environ.get("DEEPSEEK_API_KEY", "your-own-api-key"),
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "extra_body": {},
        "messages": []
    },
    "tongyi": {
        "api_key": os.environ.get("TONGYI_API_KEY", "your-own-api-key"),
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-max",
        "extra_body": {},
        "messages": []
    },
    "minimax": {
        "api_key": os.environ.get("MINIMAX_API_KEY", "your-own-api-key"),
        "base_url": "https://api.minimax.chat/v1",
        "model": "abab6-chat",
        "extra_body": {},
        "messages": []
    },
    "qianfan": {
        "api_key": os.environ.get("QIANFAN_API_KEY", "your-own-api-key"),
        "base_url": "https://qianfan.baidubce.com/api/text/chat/completions",
        "model": "ernie-3.5-turbo",
        "extra_body": {},
        "messages": []
    },
}

param = {
    "max_new_tokens": 3000,
    "temperature": 0.7,
    "stream": False
}

system_prompt = "请用简洁、专业的语言回答用户的问题，基于提供的上下文进行分析。"


def call_openai_compatible(model_id, messages, stream=False):
    cfg = config[model_id]
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {cfg["api_key"]}'
    }

    payload = {
        "model": cfg["model"],
        "messages": messages,
        "temperature": param["temperature"],
        "max_tokens": param["max_new_tokens"],
        "stream": stream,
        **cfg["extra_body"]
    }

    try:
        response = requests.post(
            f"{cfg['base_url']}/chat/completions",
            headers=headers,
            json=payload,
            stream=stream,
            timeout=60
        )
        response.raise_for_status()

        if stream:
            result = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        json_str = line_str[6:]
                        if json_str == '[DONE]':
                            break
                        try:
                            import json
                            chunk = json.loads(json_str)
                            if chunk.get('choices'):
                                delta = chunk['choices'][0].get('delta', {})
                                if delta.get('content'):
                                    result += delta['content']
                        except:
                            continue
            return result
        else:
            data = response.json()
            if data.get('choices'):
                return data['choices'][0]['message']['content']
            return str(data)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"HTTP 请求失败: {str(e)}")


def clean_response(response):
    response = re.sub(r'.*?</think>\s*', '', response, flags=re.DOTALL)
    return response.strip()


@app.route('/api/v1/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        model_id = data.get('model_id', 'tongyi')
        question = data.get('question', '')
        context = data.get('context', '')
        stream = data.get('stream', False)

        if not question:
            return jsonify({"error": "Please enter a question"}), 400

        if model_id not in config:
            return jsonify({"error": f"Unknown model: {model_id}"}), 400

        messages = [{"role": "system", "content": system_prompt}]

        if context:
            messages.append({"role": "user", "content": f"文档上下文：\n{context}\n\n基于以上上下文回答问题："})

        messages.append({"role": "user", "content": question})

        response = call_openai_compatible(model_id, messages, stream)

        response = clean_response(response)

        config[model_id]["messages"].append({"role": "user", "content": question})
        config[model_id]["messages"].append({"role": "assistant", "content": response})

        return jsonify({
            "model_id": model_id,
            "question": question,
            "answer": response,
            "context_provided": bool(context)
        })

    except Exception as e:
        return jsonify({"error": f"Failed to call model: {str(e)}"}), 500


@app.route('/api/v1/models', methods=['GET'])
def get_models():
    return jsonify({
        "models": list(config.keys()),
        "default": "tongyi",
        "supported_features": ["context", "stream"]
    })


@app.route('/api/v1/history/<model_id>', methods=['GET'])
def get_history(model_id):
    if model_id not in config:
        return jsonify({"error": f"Unknown model: {model_id}"}), 400

    return jsonify({
        "model_id": model_id,
        "history": config[model_id]["messages"]
    })


@app.route('/api/v1/history/<model_id>', methods=['DELETE'])
def clear_history(model_id):
    if model_id not in config:
        return jsonify({"error": f"Unknown model: {model_id}"}), 400

    config[model_id]["messages"] = []
    return jsonify({"status": "success", "message": "History cleared"})


@app.route('/api/v1/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ai-gateway"})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
