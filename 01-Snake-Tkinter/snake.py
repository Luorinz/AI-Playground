# -*- coding: utf-8 -*-

import random
import tkinter as tk
import tkinter.font as tkfont
from collections import deque


class SnakeGame:
    def __init__(self, width=600, height=400, cell_size=20, speed=100, auto_play=False):
        self.width = width
        self.height = height
        self.cell_size = cell_size
        self.cols = width // cell_size
        self.rows = height // cell_size
        self.speed = speed
        self.auto_play = auto_play

        self.root = tk.Tk()
        self.root.title("贪吃蛇")

        self.ui_font_family = None
        candidate_families = [
            # "SimSun",
            # "宋体",
            # "KaiTi",
            # "楷体",
            # "Microsoft YaHei",
            # "微软雅黑",
            # "Noto Sans CJK SC",
            # "Noto Sans SC",
            "WenQuanYi Zen Hei",
            "WenQuanYi Zen Hei Mono",
            "WenQuanYi Micro Hei",
            "Yu Gothic UI",
        ]
        for fam in candidate_families:
            try:
                tkfont.Font(family=fam, size=12)
                self.ui_font_family = fam
                break
            except tk.TclError:
                continue
        if self.ui_font_family:
            print("使用字体:", self.ui_font_family)
        else:
            print("未检测到中文字体家族, 使用Tk默认字体")

        self.canvas = tk.Canvas(self.root, width=self.width, height=self.height, bg="black")
        self.canvas.pack()

        self.score = 0
        self.score_var = tk.StringVar()
        self.score_var.set("得分：0")
        # self.ui_font_family = "WenQuanYi Micro Hei"
        print(self.ui_font_family)
        if self.ui_font_family:
            self.label = tk.Label(self.root, textvariable=self.score_var, font=(self.ui_font_family, 14))
        else:
            self.label = tk.Label(self.root, textvariable=self.score_var)
        self.label.pack()

        self.direction = "Right"
        self.pending_direction = "Right"
        self.snake = []
        self.food = None
        self.game_over = False

        self.root.bind("<Up>", lambda event: self.change_direction("Up"))
        self.root.bind("<Down>", lambda event: self.change_direction("Down"))
        self.root.bind("<Left>", lambda event: self.change_direction("Left"))
        self.root.bind("<Right>", lambda event: self.change_direction("Right"))
        self.root.bind("<Return>", self.restart)

        self.mode_selected = False

        self.show_mode_selection()

    def init_game(self):
        self.canvas.delete("all")
        self.score = 0
        self.score_var.set("得分：0")
        self.direction = "Right"
        self.pending_direction = "Right"
        self.game_over = False

        start_x = self.cols // 2
        start_y = self.rows // 2
        self.snake = [(start_x - 1, start_y), (start_x, start_y), (start_x + 1, start_y)]

        self.place_food()
        self.draw()
        self.schedule_move()

    def show_mode_selection(self):
        self.canvas.delete("all")
        title_font = (self.ui_font_family, 28) if self.ui_font_family else None
        button_font = (self.ui_font_family, 18) if self.ui_font_family else None

        self.canvas.create_text(
            self.width // 2,
            self.height // 3,
            text="请选择模式",
            fill="white",
            font=title_font,
        )

        def start_human():
            self.auto_play = False
            self.mode_selected = True
            self.init_game()

        def start_ai():
            self.auto_play = True
            self.mode_selected = True
            self.init_game()

        button_frame = tk.Frame(self.root)
        if self.ui_font_family:
            human_button = tk.Button(button_frame, text="人类玩家", font=button_font, command=start_human, width=10)
            ai_button = tk.Button(button_frame, text="AI 玩家", font=button_font, command=start_ai, width=10)
        else:
            human_button = tk.Button(button_frame, text="人类玩家", command=start_human, width=10)
            ai_button = tk.Button(button_frame, text="AI 玩家", command=start_ai, width=10)

        human_button.pack(side=tk.LEFT, padx=10)
        ai_button.pack(side=tk.LEFT, padx=10)
        button_frame.pack(pady=40)

        self.mode_button_frame = button_frame

    def schedule_move(self):
        if not self.game_over:
            self.root.after(self.speed, self.move)

    def change_direction(self, new_direction):
        opposite = {
            "Up": "Down",
            "Down": "Up",
            "Left": "Right",
            "Right": "Left",
        }
        if opposite.get(new_direction) != self.direction:
            self.pending_direction = new_direction

    def move(self):
        if self.game_over:
            return

        if self.auto_play:
            self.pending_direction = self.get_ai_direction()

        self.direction = self.pending_direction

        head_x, head_y = self.snake[-1]
        if self.direction == "Up":
            head_y -= 1
        elif self.direction == "Down":
            head_y += 1
        elif self.direction == "Left":
            head_x -= 1
        elif self.direction == "Right":
            head_x += 1

        if head_x < 0 or head_x >= self.cols or head_y < 0 or head_y >= self.rows:
            self.end_game()
            return

        new_head = (head_x, head_y)

        if new_head in self.snake:
            self.end_game()
            return

        self.snake.append(new_head)

        if new_head == self.food:
            self.score += 1
            self.score_var.set(f"得分：{self.score}")
            self.place_food()
        else:
            self.snake.pop(0)

        self.draw()
        self.schedule_move()

    def is_inside(self, x, y):
        return 0 <= x < self.cols and 0 <= y < self.rows

    def neighbors(self, x, y):
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            nx = x + dx
            ny = y + dy
            if self.is_inside(nx, ny):
                yield nx, ny

    def bfs(self, start, goal, blocked):
        queue = deque([start])
        came_from = {start: None}
        while queue:
            x, y = queue.popleft()
            if (x, y) == goal:
                path = []
                current = goal
                while current is not None:
                    path.append(current)
                    current = came_from[current]
                path.reverse()
                return path
            for nx, ny in self.neighbors(x, y):
                if (nx, ny) in blocked:
                    continue
                if (nx, ny) in came_from:
                    continue
                came_from[(nx, ny)] = (x, y)
                queue.append((nx, ny))
        return None

    def get_ai_direction(self):
        directions = ["Up", "Down", "Left", "Right"]
        opposite = {
            "Up": "Down",
            "Down": "Up",
            "Left": "Right",
            "Right": "Left",
        }
        head_x, head_y = self.snake[-1]
        safe_candidates = []
        for d in directions:
            if opposite.get(d) == self.direction and len(self.snake) > 1:
                continue
            nx = head_x
            ny = head_y
            if d == "Up":
                ny -= 1
            elif d == "Down":
                ny += 1
            elif d == "Left":
                nx -= 1
            elif d == "Right":
                nx += 1
            if not self.is_inside(nx, ny):
                continue
            if (nx, ny) in self.snake[:-1]:
                continue
            safe_candidates.append((d, nx, ny))

        if not safe_candidates:
            return self.direction

        if self.food is None:
            return safe_candidates[0][0]

        blocked = set(self.snake[:-1])
        best_dir = None
        best_dist = None
        for d, nx, ny in safe_candidates:
            path = self.bfs((nx, ny), self.food, blocked)
            if path is None:
                continue
            dist = len(path)
            if best_dist is None or dist < best_dist:
                best_dist = dist
                best_dir = d

        if best_dir is not None:
            return best_dir

        return safe_candidates[0][0]

    def place_food(self):
        empty_cells = [(x, y) for x in range(self.cols) for y in range(self.rows) if (x, y) not in self.snake]
        if not empty_cells:
            self.end_game()
            return
        self.food = random.choice(empty_cells)

    def draw_cell(self, x, y, color):
        x1 = x * self.cell_size
        y1 = y * self.cell_size
        x2 = x1 + self.cell_size
        y2 = y1 + self.cell_size
        self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline="")

    def draw(self):
        self.canvas.delete("all")
        for x, y in self.snake[:-1]:
            self.draw_cell(x, y, "green")
        head_x, head_y = self.snake[-1]
        self.draw_cell(head_x, head_y, "lime")
        if self.food is not None:
            fx, fy = self.food
            self.draw_cell(fx, fy, "red")
        if self.game_over:
            game_over_font = (self.ui_font_family, 24) if self.ui_font_family else None
            self.canvas.create_text(
                self.width // 2,
                self.height // 2,
                text="游戏结束\n按回车键重新开始",
                fill="white",
                font=game_over_font,
            )

    def end_game(self):
        self.game_over = True
        self.draw()

    def restart(self, event=None):
        if self.game_over:
            self.init_game()

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    game = SnakeGame(auto_play=True)
    game.run()
