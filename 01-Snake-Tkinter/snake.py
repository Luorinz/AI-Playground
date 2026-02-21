# -*- coding: utf-8 -*-
"""贪吃蛇游戏 - 使用 Tkinter 实现的经典贪吃蛇游戏，支持人机对战和 AI 自动玩模式。"""

import random
import tkinter as tk
import tkinter.font as tkfont
from collections import deque
from typing import Optional, Tuple, List, Set, Generator, Any

# 游戏常量
DEFAULT_WIDTH = 600
DEFAULT_HEIGHT = 400
DEFAULT_CELL_SIZE = 20
DEFAULT_SPEED_MS = 100

# 字体大小常量
FONT_SIZE_TITLE = 28
FONT_SIZE_BUTTON = 18
FONT_SIZE_SCORE = 14
FONT_SIZE_GAME_OVER = 24

# 颜色常量
COLOR_BACKGROUND = "black"
COLOR_SNAKE_BODY = "green"
COLOR_SNAKE_HEAD = "lime"
COLOR_FOOD = "red"
COLOR_TEXT = "white"

# 方向常量
DIRECTION_UP = "Up"
DIRECTION_DOWN = "Down"
DIRECTION_LEFT = "Left"
DIRECTION_RIGHT = "Right"

# UI 文本
UI_TEXT_TITLE = "请选择模式"
UI_TEXT_HUMAN = "人类玩家"
UI_TEXT_AI = "AI 玩家"
UI_TEXT_GAME_OVER = "游戏结束\n按回车键重新开始"
UI_TEXT_SCORE = "得分：{score}"


class SnakeGame:
    """贪吃蛇游戏主类，支持人机对战和 AI 自动玩模式。

    Attributes:
        width: 游戏窗口宽度（像素）
        height: 游戏窗口高度（像素）
        cell_size: 蛇身和食物的单元格大小（像素）
        speed: 游戏速度（毫秒/帧）
        auto_play: 是否启用 AI 自动玩模式
    """

    def __init__(self, width: int = DEFAULT_WIDTH, height: int = DEFAULT_HEIGHT,
                 cell_size: int = DEFAULT_CELL_SIZE, speed: int = DEFAULT_SPEED_MS,
                 auto_play: bool = False):
        """初始化游戏。

        Args:
            width: 游戏窗口宽度
            height: 游戏窗口高度
            cell_size: 单元格大小
            speed: 游戏速度（毫秒）
            auto_play: 是否启用 AI 模式
        """
        self.width = width
        self.height = height
        self.cell_size = cell_size
        self.cols = width // cell_size
        self.rows = height // cell_size
        self.speed = speed
        self.auto_play = auto_play

        self.root = tk.Tk()
        self.root.title("贪吃蛇")

        self.ui_font_family: Optional[str] = None
        self._detect_ui_font()

        self.canvas = tk.Canvas(self.root, width=self.width, height=self.height, bg=COLOR_BACKGROUND)
        self.canvas.pack()

        self.score = 0
        self.score_var = tk.StringVar()
        self.score_var.set(UI_TEXT_SCORE.format(score=0))

        self._create_score_label()

        self.direction = DIRECTION_RIGHT
        self.pending_direction = DIRECTION_RIGHT
        self.direction_changed_this_tick = False
        self.snake: List[Tuple[int, int]] = []
        self.food: Optional[Tuple[int, int]] = None
        self.game_over = False

        self._bind_keys()

        self.mode_button_frame: Optional[tk.Frame] = None

        self.show_mode_selection()

    def _detect_ui_font(self) -> None:
        """检测可用的中文字体家族。"""
        candidate_families = [
            "WenQuanYi Zen Hei",
            "WenQuanYi Zen Hei Mono",
            "WenQuanYi Micro Hei",
            "Yu Gothic UI",
        ]
        for fam in candidate_families:
            try:
                tkfont.Font(family=fam, size=12)
                self.ui_font_family = fam
                print("使用字体:", self.ui_font_family)
                return
            except tk.TclError:
                continue
        print("未检测到中文字体家族，使用 Tk 默认字体")

    def _create_score_label(self) -> None:
        """创建分数标签。"""
        if self.ui_font_family:
            self.label = tk.Label(self.root, textvariable=self.score_var, font=(self.ui_font_family, FONT_SIZE_SCORE))
        else:
            self.label = tk.Label(self.root, textvariable=self.score_var)
        self.label.pack()

    def _bind_keys(self) -> None:
        """绑定键盘事件。"""
        self.root.bind("<Up>", lambda event: self.change_direction(DIRECTION_UP))
        self.root.bind("<Down>", lambda event: self.change_direction(DIRECTION_DOWN))
        self.root.bind("<Left>", lambda event: self.change_direction(DIRECTION_LEFT))
        self.root.bind("<Right>", lambda event: self.change_direction(DIRECTION_RIGHT))
        self.root.bind("<Return>", self.restart)

    def init_game(self) -> None:
        """初始化游戏状态，开始新游戏。"""
        self.canvas.delete("all")
        self._destroy_mode_buttons()
        self.score = 0
        self.score_var.set(UI_TEXT_SCORE.format(score=0))
        self.direction = DIRECTION_RIGHT
        self.pending_direction = DIRECTION_RIGHT
        self.direction_changed_this_tick = False
        self.game_over = False

        start_x = self.cols // 2
        start_y = self.rows // 2
        self.snake = [(start_x - 1, start_y), (start_x, start_y), (start_x + 1, start_y)]

        self.place_food()
        self.draw()
        self.schedule_move()

    def _destroy_mode_buttons(self) -> None:
        """销毁模式选择按钮框架。"""
        if self.mode_button_frame is not None:
            self.mode_button_frame.destroy()
            self.mode_button_frame = None

    def show_mode_selection(self) -> None:
        """显示模式选择界面。"""
        self.canvas.delete("all")
        title_font = (self.ui_font_family, FONT_SIZE_TITLE) if self.ui_font_family else None
        button_font = (self.ui_font_family, FONT_SIZE_BUTTON) if self.ui_font_family else None

        self.canvas.create_text(
            self.width // 2,
            self.height // 3,
            text=UI_TEXT_TITLE,
            fill=COLOR_TEXT,
            font=title_font,
        )

        def start_human():
            self.auto_play = False
            self.init_game()

        def start_ai():
            self.auto_play = True
            self.init_game()

        button_frame = tk.Frame(self.root)
        if self.ui_font_family:
            human_button = tk.Button(button_frame, text=UI_TEXT_HUMAN, font=button_font, command=start_human, width=10)
            ai_button = tk.Button(button_frame, text=UI_TEXT_AI, font=button_font, command=start_ai, width=10)
        else:
            human_button = tk.Button(button_frame, text=UI_TEXT_HUMAN, command=start_human, width=10)
            ai_button = tk.Button(button_frame, text=UI_TEXT_AI, command=start_ai, width=10)

        human_button.pack(side=tk.LEFT, padx=10)
        ai_button.pack(side=tk.LEFT, padx=10)
        button_frame.pack(pady=40)

        self.mode_button_frame = button_frame

    def schedule_move(self) -> None:
        """安排下一次移动。"""
        if not self.game_over:
            self.root.after(self.speed, self.move)

    def change_direction(self, new_direction: str) -> None:
        """改变蛇的移动方向。

        Args:
            new_direction: 新方向（Up/Down/Left/Right）

        Note:
            禁止 180 度转向，且每个 tick 只允许改变一次方向。
        """
        opposite = {
            DIRECTION_UP: DIRECTION_DOWN,
            DIRECTION_DOWN: DIRECTION_UP,
            DIRECTION_LEFT: DIRECTION_RIGHT,
            DIRECTION_RIGHT: DIRECTION_LEFT,
        }
        # 禁止 180 度转向且每个 tick 只允许改变一次方向
        if opposite.get(new_direction) != self.direction and not self.direction_changed_this_tick:
            self.pending_direction = new_direction
            self.direction_changed_this_tick = True

    def move(self) -> None:
        """执行蛇的移动逻辑。"""
        if self.game_over:
            return

        if self.auto_play:
            self.pending_direction = self.get_ai_direction()

        self.direction = self.pending_direction
        self.direction_changed_this_tick = False  # 重置方向改变标记

        head_x, head_y = self.snake[-1]
        if self.direction == DIRECTION_UP:
            head_y -= 1
        elif self.direction == DIRECTION_DOWN:
            head_y += 1
        elif self.direction == DIRECTION_LEFT:
            head_x -= 1
        elif self.direction == DIRECTION_RIGHT:
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
            self.score_var.set(UI_TEXT_SCORE.format(score=self.score))
            self.place_food()
        else:
            self.snake.pop(0)

        self.draw()
        self.schedule_move()

    def is_inside(self, x: int, y: int) -> bool:
        """检查坐标是否在游戏边界内。

        Args:
            x: X 坐标
            y: Y 坐标

        Returns:
            如果坐标在边界内返回 True，否则 False
        """
        return 0 <= x < self.cols and 0 <= y < self.rows

    def neighbors(self, x: int, y: int) -> Generator[Tuple[int, int], None, None]:
        """获取相邻的四个方向坐标。

        Args:
            x: X 坐标
            y: Y 坐标

        Yields:
            相邻坐标的元组
        """
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            nx = x + dx
            ny = y + dy
            if self.is_inside(nx, ny):
                yield nx, ny

    def bfs(self, start: Tuple[int, int], goal: Tuple[int, int],
            blocked: Set[Tuple[int, int]]) -> Optional[List[Tuple[int, int]]]:
        """使用 BFS 寻找从起点到终点的路径。

        Args:
            start: 起点坐标
            goal: 终点坐标
            blocked: 障碍物坐标集合

        Returns:
            路径坐标列表，如果找不到路径返回 None
        """
        queue = deque([start])
        came_from: dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
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

    def get_ai_direction(self) -> str:
        """使用 BFS 算法获取 AI 的移动方向。

        Returns:
            最佳移动方向
        """
        head_x, head_y = self.snake[-1]
        safe_candidates: List[Tuple[str, int, int]] = []

        for d in [DIRECTION_UP, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT]:
            # 检查是否是相反方向
            opposite = {
                DIRECTION_UP: DIRECTION_DOWN,
                DIRECTION_DOWN: DIRECTION_UP,
                DIRECTION_LEFT: DIRECTION_RIGHT,
                DIRECTION_RIGHT: DIRECTION_LEFT,
            }
            if opposite.get(d) == self.direction and len(self.snake) > 1:
                continue

            nx, ny = head_x, head_y
            if d == DIRECTION_UP:
                ny -= 1
            elif d == DIRECTION_DOWN:
                ny += 1
            elif d == DIRECTION_LEFT:
                nx -= 1
            elif d == DIRECTION_RIGHT:
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
        best_dir: Optional[str] = None
        best_dist: Optional[int] = None

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

    def place_food(self) -> None:
        """在空白位置放置食物。"""
        empty_cells = [(x, y) for x in range(self.cols) for y in range(self.rows) if (x, y) not in self.snake]
        if not empty_cells:
            self.end_game()
            return
        self.food = random.choice(empty_cells)

    def draw_cell(self, x: int, y: int, color: str) -> None:
        """绘制单个单元格。

        Args:
            x: X 坐标
            y: Y 坐标
            color: 颜色
        """
        x1 = x * self.cell_size
        y1 = y * self.cell_size
        x2 = x1 + self.cell_size
        y2 = y1 + self.cell_size
        self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline="")

    def draw(self) -> None:
        """绘制游戏画面。"""
        self.canvas.delete("all")
        for x, y in self.snake[:-1]:
            self.draw_cell(x, y, COLOR_SNAKE_BODY)
        head_x, head_y = self.snake[-1]
        self.draw_cell(head_x, head_y, COLOR_SNAKE_HEAD)
        if self.food is not None:
            fx, fy = self.food
            self.draw_cell(fx, fy, COLOR_FOOD)
        if self.game_over:
            game_over_font = (self.ui_font_family, FONT_SIZE_GAME_OVER) if self.ui_font_family else None
            self.canvas.create_text(
                self.width // 2,
                self.height // 2,
                text=UI_TEXT_GAME_OVER,
                fill=COLOR_TEXT,
                font=game_over_font,
            )

    def end_game(self) -> None:
        """结束游戏。"""
        self.game_over = True
        self.draw()

    def restart(self, event: Optional[tk.Event] = None) -> None:
        """重新开始游戏。

        Args:
            event: 触发事件（可选）
        """
        if self.game_over:
            self.init_game()

    def run(self) -> None:
        """启动游戏主循环。"""
        self.root.mainloop()


if __name__ == "__main__":
    game = SnakeGame(auto_play=True)
    game.run()
