from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re

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
    "gemini": {
        "api_key": os.environ.get("GEMINI_API_KEY", "your-own-api-key"),
        "base_url": "https://generativelanguage.googleapis.com/v1beta/models",
        "model": "gemini-2.0-flash",
        "extra_body": {},
        "messages": []
    },
    "openai": {
        "api_key": os.environ.get("OPENAI_API_KEY", "your-own-api-key"),
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-3.5-turbo",
        "extra_body": {},
        "messages": []
    }
}

param = {
    "max_new_tokens": 3000,
    "temperature": 0.7,
    "stream": False
}

system_prompt = "请用简洁、专业的语言回答用户的问题，基于提供的上下文进行分析。"


def call_openai_compatible(model_id, messages, stream=False):
    import openai
    client = openai.OpenAI(
        api_key=config[model_id]["api_key"],
        base_url=config[model_id]["base_url"]
    )
    
    message = client.chat.completions.create(
        model=config[model_id]["model"],
        messages=messages,
        extra_body=config[model_id]["extra_body"],
        temperature=param["temperature"],
        max_tokens=param["max_new_tokens"],
        stream=stream
    )
    
    if stream:
        response = ""
        for chunk in message:
            if chunk.choices[0].delta.content is not None:
                response += chunk.choices[0].delta.content
        return response
    else:
        return message.choices[0].message.content


def call_gemini(model_id, messages, stream=False):
    import google.generativeai as genai
    
    genai.configure(api_key=config[model_id]["api_key"])
    model = genai.GenerativeModel(config[model_id]["model"])
    
    text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    response = model.generate_content(text, stream=stream)
    
    if stream:
        result = ""
        for chunk in response:
            result += chunk.text
        return result
    else:
        return response.text


def clean_response(response):
    response = re.sub(r'.*?</think>\s*', '', response, flags=re.DOTALL)
    return response.strip()


@app.route('/api/v1/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        model_id = data.get('model_id', 'gemini')
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
        
        if model_id == "gemini":
            response = call_gemini(model_id, messages, stream)
        else:
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
        "default": "gemini",
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
