import os
import sys
import time
import threading
import webview
from flask import Flask, render_template, jsonify, request

# ========== 打包后路径判断 ==========
if getattr(sys, "frozen", False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.abspath(".")

app = Flask(
    __name__,
    template_folder=os.path.join(base_path, "templates"),
    static_folder=os.path.join(base_path, "static"),
)


# ========== 关闭缓存 ==========
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# ========== 全局变量 ==========
N = 9  # 九连环的环数
password = "159730"

# 👇 新增：彩蛋状态文件路径
if getattr(sys, "frozen", False):
    # 打包后：exe 同级目录
    data_dir = os.path.dirname(sys.executable)
else:
    data_dir = os.path.abspath(".")

SECRET_FILE = os.path.join(data_dir, "secret_flag.txt")


# ========== 九连环规则判断 ==========
def is_valid(state, i):
    """判断第 i 环（0-based）能否切换状态"""
    if i == 0:
        return True
    if state[i - 1] != 1:  # 前一环必须在架上
        return False
    # 1 到 i-2 环必须全部不在架上
    return all(state[j] == 0 for j in range(i - 1))


# ========== BFS 求解 ==========
def solve(state):
    """BFS 求解，返回从当前状态到全下的最短操作序列"""
    from collections import deque

    start = tuple(state)
    goal = tuple([0] * N)
    if start == goal:
        return []
    visited = {start}
    queue = deque([(start, [])])
    while queue:
        cur, path = queue.popleft()
        for i in range(N):
            if is_valid(cur, i):
                nxt = list(cur)
                nxt[i] ^= 1
                nxt = tuple(nxt)
                if nxt == goal:
                    return path + [i]
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, path + [i]))
    return []


# ========== 路由 ==========
@app.route("/")
def index():
    return render_template("index.html", n=N)


@app.route("/api/solve", methods=["POST"])
def api_solve():
    data = request.get_json()

    # password verification
    if data.get("password") != password:
        return jsonify({"error": "不要偷懒呦"}), 403

    state = data["state"]
    moves = solve(state)
    return jsonify({"moves": moves})


# ========== 启动 Flask（后台线程） ==========
def start_flask():
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)


# ========== 窗口关闭回调 ==========
def on_closed():
    os._exit(0)


# ========== 主入口 ==========
if __name__ == "__main__":
    app.run(port=5001, debug=True)
