# 在 WSL 上用 Python 写一个带中文界面的贪吃蛇  
——顺便把 Tkinter + 字体 + conda 的坑踩完

## 0. 案例背景

- 技术栈：Python + Tkinter
- 运行环境：
  - Windows 11 + WSL2（Ubuntu 24.04）
  - WSLg 提供 GUI 能力
  - 同时安装了 Miniconda / conda
- 目标：
  1. 实现一个经典贪吃蛇游戏；
  2. 游戏界面全中文，并在 WSL 下正常显示；
  3. 给贪吃蛇加上 AI 自动玩，尽量不死；
  4. 用 Trae 帮忙完成开发、调试和测试；
  5. 把 Tk 字体 & conda 的坑梳理清楚。

结果：  
游戏本身很快完成，真正耗时间的是：**WSL + conda + Tkinter 中文字体** 组合拳。

---

## 1. 从 `hello world` 到完整贪吃蛇

一开始项目里只有一个 `test.py`：

```python
print("hello world")
```

在这个文件上迭代，最终做成了一个可运行的贪吃蛇游戏。

### 1.1 游戏基础结构

使用 Tkinter 的 Canvas 绘制蛇和食物：

```python
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

        # 1）选择中文字体（后面详细讲）
        self.ui_font_family = None
        candidate_families = [
            "SimSun",
            "宋体",
            "Microsoft YaHei",
            "微软雅黑",
            "Noto Sans CJK SC",
            "Noto Sans SC",
            "WenQuanYi Zen Hei",
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

        # 2）画布
        self.canvas = tk.Canvas(self.root, width=self.width, height=self.height, bg="black")
        self.canvas.pack()

        # 3）分数标签
        self.score = 0
        self.score_var = tk.StringVar()
        self.score_var.set("得分：0")
        if self.ui_font_family:
            self.label = tk.Label(self.root, textvariable=self.score_var, font=(self.ui_font_family, 14))
        else:
            self.label = tk.Label(self.root, textvariable=self.score_var)
        self.label.pack()

        # 游戏状态
        self.direction = "Right"
        self.pending_direction = "Right"
        self.snake = []
        self.food = None
        self.game_over = False

        # 键盘绑定
        self.root.bind("<Up>", lambda event: self.change_direction("Up"))
        self.root.bind("<Down>", lambda event: self.change_direction("Down"))
        self.root.bind("<Left>", lambda event: self.change_direction("Left"))
        self.root.bind("<Right>", lambda event: self.change_direction("Right"))
        self.root.bind("<Return>", self.restart)

        self.mode_selected = False
        self.show_mode_selection()
```

### 1.2 游戏核心逻辑

初始化、移动、绘制：

```python
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

        # 自动模式交给 AI 决策
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

        # 撞墙
        if head_x < 0 or head_x >= self.cols or head_y < 0 or head_y >= self.rows:
            self.end_game()
            return

        new_head = (head_x, head_y)

        # 撞自己
        if new_head in self.snake:
            self.end_game()
            return

        self.snake.append(new_head)

        # 吃食物
        if new_head == self.food:
            self.score += 1
            self.score_var.set(f"得分：{self.score}")
            self.place_food()
        else:
            self.snake.pop(0)

        self.draw()
        self.schedule_move()
```

绘制蛇和食物：

```python
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
```

入口：

```python
if __name__ == "__main__":
    game = SnakeGame(auto_play=True)  # 或者 False
    game.run()
```

---

## 2. AI 自动玩：BFS 寻路 + 安全候选方向

你希望 AI 能自己玩，并尽量不死。我们采用了简单易懂、效果不错的方案：

1. 筛掉明显会死的方向；
2. 对剩下方向，找一条从该新位置到食物的 BFS 路径；
3. 选路径最短的方向。

辅助方法：

```python
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
```

AI 决策：

```python
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
            # 不直接掉头
            if opposite.get(d) == self.direction and len(self.snake) > 1:
                continue
            nx, ny = head_x, head_y
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
```

效果：  
在普通尺寸棋盘上，这种策略可以让蛇活很久、稳定吃食物。不是完美算法，但对示例游戏非常够用。

---

## 3. 模式选择：人类玩家 vs AI 玩家

游戏开始前加入一个模式选择界面：

```python
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
```

玩家打开游戏后：

1. 先看到“请选择模式”；
2. 选“人类玩家” → 用方向键玩；
3. 选“AI 玩家” → AI 自动玩。

---

## 4. 中文字体问题：代码层面统一、环境层面抽疯

### 4.1 代码层面：统一字体

我们在 `__init__` 里统一做字体选择，并输出调试信息：

```python
self.ui_font_family = None
candidate_families = [
    "SimSun",
    "宋体",
    "Microsoft YaHei",
    "微软雅黑",
    "Noto Sans CJK SC",
    "Noto Sans SC",
    "WenQuanYi Zen Hei",
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
```

然后所有界面文字都用 `self.ui_font_family`：

- 分数 Label；
- 模式选择标题、按钮；
- 游戏结束提示。

从“Tk 调用层面”来看，逻辑是统一且正确的。

### 4.2 环境层面：WSL + conda 的 Tk 看不到字体

问题出在这里：

- 用 conda 的 Python + Tk 调试：

  ```python
  import tkinter.font as f
  families = f.families()
  print("Tk 可见字体数量:", len(families))
  ```

  结果：

  ```text
  Tk 可见字体数量: 1
  'SimSun' in families -> False
  'Noto Sans CJK SC' in families -> False
  'WenQuanYi Zen Hei' in families -> False
  ...
  ```

  → Tk 在这个环境里实际上只有一个默认字体，任何你指定的 CJK 字体名字都不存在。

- 用 WSL 自带的 `/usr/bin/python3` + Tk 调试：
  - `families()` 返回大量字体；
  - 安装 `fonts-noto-cjk` / `fonts-wqy-zenhei` 后，能看到真正的 CJK 字体；
  - 同样的代码 + 游戏，在系统 Python 下中文显示完全正常。

**结论：**

> conda 环境中的 Tk 构建，在你的 WSL + WSLg 场景下“看不到”系统字体，  
> 导致界面内部想用的中文字体根本不能生效。

标题之所以正常，是因为标题栏是 Windows/WSLg 的窗口管理器画的，用的是 Windows UI 字体，与 Tk 无关。

---

## 5. 单元测试：自动校验字体绑定

测试文件：`test_snake_fonts.py`

关键测试点：

```python
import unittest
import tkinter as tk
from test import SnakeGame


class SnakeFontTests(unittest.TestCase):
    def setUp(self):
        self.game = SnakeGame(auto_play=False)

    def tearDown(self):
        try:
            self.game.root.destroy()
        except tk.TclError:
            pass

    def test_ui_font_family_selected(self):
        self.assertIsNotNone(self.game.ui_font_family)

    def test_score_label_uses_ui_font(self):
        font_value = self.game.label.cget("font")
        self.assertIn(self.game.ui_font_family, str(font_value))

    def test_mode_screen_text_uses_ui_font(self):
        items = self.game.canvas.find_all()
        text_items = [i for i in items if self.game.canvas.type(i) == "text"]
        self.assertGreater(len(text_items), 0)
        for item in text_items:
            text = self.game.canvas.itemcget(item, "text")
            if "请选择模式" in text:
                font_value = self.game.canvas.itemcget(item, "font")
                self.assertIn(self.game.ui_font_family, str(font_value))
                return
        self.fail("未找到模式选择标题文本")

    def test_game_over_text_uses_ui_font(self):
        self.game.init_game()
        self.game.end_game()
        items = self.game.canvas.find_all()
        text_items = [i for i in items if self.game.canvas.type(i) == "text"]
        self.assertGreater(len(text_items), 0)
        for item in text_items:
            text = self.game.canvas.itemcget(item, "text")
            if "游戏结束" in text:
                font_value = self.game.canvas.itemcget(item, "font")
                self.assertIn(self.game.ui_font_family, str(font_value))
                return
        self.fail("未找到游戏结束文本")
```

在“环境正确”的情况下（系统 Python + 正常 Tk）：

```bash
python -m unittest test_snake_fonts.py
```

输出类似：

```text
使用字体: Noto Sans CJK SC
.使用字体: Noto Sans CJK SC
.使用字体: Noto Sans CJK SC
.使用字体: Noto Sans CJK SC
.
----------------------------------------------------------------------
Ran 4 tests in 0.12s

OK
```

这保证了：

- 字体确实被选出来；
- 所有关键文字的位置确实绑定了同一中文字体。

---

## 6. 最终实践方案（重点）

结合所有踩坑结果，最终推荐的做法是：

1. **在 WSL 内，所有 Tk GUI 程序（包括贪吃蛇）统一使用系统 Python：**

   ```bash
   cd /home/anda/projects/playground

   # 跑测试
   /usr/bin/python3 -m unittest test_snake_fonts.py

   # 跑游戏
   /usr/bin/python3 test.py
   ```

2. **数值计算、命令行工具继续用 conda 环境：**
   - 不在 conda 环境里跑 Tk GUI，避免因为 Tk 构建问题导致字体不可用。

3. **必要时，在 Windows 原生 Python 下运行：**

   如果你想完全绕过 WSLg：

   ```powershell
   python \\wsl$\Ubuntu\home\anda\projects\playground\test.py
   ```

   或者把代码拷贝到 Windows 盘，用 Windows Python 执行。  
   这样 Tk 直接用 Windows 字体和渲染栈，中文显示最稳定。

---

## 7. 本案例的经验总结

1. **用 Tk 做中文界面时，先写一个最小字体调试脚本**

   - 打印 `tkinter.font.families()`
   - 简单画几行中文
   - 如果这里都不对，再改业务代码是浪费时间。

2. **区分“代码层问题”和“环境层问题”**

   - 代码层：统一指定 `font=(family, size)`，加测试校验；
   - 环境层：Tk 是否能看到字体、WSLg 是否正常、locale 是否是 UTF-8。

3. **在多 Python 环境中，明确定义“哪个环境负责 GUI”**

   - 本案例实践：  
     - GUI → `/usr/bin/python3`  
     - 其它 → conda  
   - 避免因为某个环境的 Tk 构建不完整，拖垮图形界面。

4. **Trae 的价值**

   - 快速生成游戏骨架、AI 逻辑、模式选择界面；
   - 自动编写和运行字体相关的单元测试；
   - 帮助调试 WSL + Tk + conda 环境问题（各种脚本和命令“一键生成”）。

---

## 8. 如何在你的环境中复现本案例

1. 进入项目目录：

   ```bash
   cd /home/anda/projects/playground
   ```

2. 确保安装了 Linux CJK 字体（可选但推荐）：

   ```bash
   sudo apt update
   sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei
   sudo fc-cache -f -v
   ```

3. 用系统 Python 验证字体 + 测试 + 游戏：

   ```bash
   /usr/bin/python3 -m unittest test_snake_fonts.py
   /usr/bin/python3 test.py
   ```

   - 终端里会输出类似 `使用字体: Noto Sans CJK SC` 或 `使用字体: SimSun`。
   - 游戏界面全部中文，AI 模式和人类模式都可选，游戏结束提示正确。

到这里，一个完整的“贪吃蛇 + WSL + Tk 中文字体 + Trae 实战案例”就串起来了：  
不仅有完整的游戏，还顺便把一个真实环境下最常见、最难排查的 GUI 中文问题拆开讲清楚了。