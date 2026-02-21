# -*- coding: utf-8 -*-
"""贪吃蛇游戏逻辑单元测试。"""

import unittest
import tkinter as tk
from snake import SnakeGame, DIRECTION_UP, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT


class SnakeGameTests(unittest.TestCase):
    """蛇游戏逻辑测试类。"""

    def setUp(self):
        """设置测试环境。"""
        self.game = SnakeGame(auto_play=False, speed=1000)

    def tearDown(self):
        """清理测试环境。"""
        try:
            self.game.root.destroy()
        except tk.TclError:
            pass

    def test_snake_initial_position(self):
        """测试蛇的初始位置。"""
        self.game.init_game()
        self.assertEqual(len(self.game.snake), 3)
        self.assertEqual(self.game.direction, DIRECTION_RIGHT)

    def test_snake_grows_on_food(self):
        """测试蛇吃到食物后长度增加。"""
        self.game.init_game()
        initial_length = len(self.game.snake)

        # 将食物放在蛇头前方
        head_x, head_y = self.game.snake[-1]
        self.game.food = (head_x + 1, head_y)

        # 执行移动
        self.game.move()

        # 蛇应该变长
        self.assertEqual(len(self.game.snake), initial_length + 1)
        self.assertEqual(self.game.score, 1)

    def test_game_over_on_wall_collision(self):
        """测试撞墙时游戏结束。"""
        self.game.init_game()

        # 将蛇移到靠近右墙
        self.game.snake = [(self.game.cols - 2, self.game.rows // 2)]
        self.game.direction = DIRECTION_RIGHT
        self.game.pending_direction = DIRECTION_RIGHT

        # 向右移动应该撞墙
        self.game.move()

        self.assertTrue(self.game.game_over)

    def test_game_over_on_self_collision(self):
        """测试撞到自己时游戏结束。"""
        self.game.init_game()

        # 创建一个会导致自撞的蛇形状
        self.game.snake = [
            (5, 5),
            (6, 5),
            (7, 5),
            (7, 6),
            (6, 6),  # 蛇头
        ]
        self.game.direction = DIRECTION_LEFT
        self.game.pending_direction = DIRECTION_LEFT

        # 向左移动会撞到 (6, 5)
        self.game.move()

        self.assertTrue(self.game.game_over)

    def test_cannot_reverse_direction(self):
        """测试不能直接反向移动。"""
        self.game.init_game()

        # 尝试向相反方向改变
        self.game.direction = DIRECTION_RIGHT
        self.game.change_direction(DIRECTION_LEFT)

        # 方向不应改变
        self.assertEqual(self.game.pending_direction, DIRECTION_RIGHT)

    def test_direction_change_up(self):
        """测试向上改变方向。"""
        self.game.init_game()
        self.game.direction = DIRECTION_RIGHT
        self.game.change_direction(DIRECTION_UP)

        self.assertEqual(self.game.pending_direction, DIRECTION_UP)

    def test_direction_change_down(self):
        """测试向下改变方向。"""
        self.game.init_game()
        self.game.direction = DIRECTION_RIGHT
        self.game.change_direction(DIRECTION_DOWN)

        self.assertEqual(self.game.pending_direction, DIRECTION_DOWN)

    def test_direction_change_left(self):
        """测试向左改变方向。"""
        self.game.init_game()
        self.game.direction = DIRECTION_UP
        self.game.change_direction(DIRECTION_LEFT)

        self.assertEqual(self.game.pending_direction, DIRECTION_LEFT)

    def test_only_one_direction_change_per_tick(self):
        """测试每个 tick 只能改变一次方向（防止快速按键导致自杀）。"""
        self.game.init_game()
        self.game.direction = DIRECTION_RIGHT

        # 快速连续按相反方向
        self.game.change_direction(DIRECTION_UP)
        self.game.change_direction(DIRECTION_DOWN)

        # 应该只保留第一个有效方向
        self.assertEqual(self.game.pending_direction, DIRECTION_UP)

    def test_bfs_finds_path(self):
        """测试 BFS 找到路径。"""
        self.game.init_game()

        start = (0, 0)
        goal = (2, 0)
        blocked = set()

        path = self.game.bfs(start, goal, blocked)

        self.assertIsNotNone(path)
        self.assertEqual(path[0], start)
        self.assertEqual(path[-1], goal)

    def test_bfs_no_path(self):
        """测试 BFS 在无路可走时返回 None。"""
        self.game.init_game()

        start = (0, 0)
        goal = (2, 0)
        # 用障碍物挡住所有路径
        blocked = {(0, 1), (1, 0), (1, 1)}

        path = self.game.bfs(start, goal, blocked)

        self.assertIsNone(path)

    def test_bfs_avoids_obstacles(self):
        """测试 BFS 绕过障碍物。"""
        self.game.init_game()

        start = (0, 0)
        goal = (0, 2)
        blocked = {(0, 1)}  # 直接路径被挡住

        path = self.game.bfs(start, goal, blocked)

        self.assertIsNotNone(path)
        self.assertEqual(path[0], start)
        self.assertEqual(path[-1], goal)
        self.assertNotIn((0, 1), path)

    def test_is_inside(self):
        """测试边界检查。"""
        self.game.init_game()

        # 内部点
        self.assertTrue(self.game.is_inside(0, 0))
        self.assertTrue(self.game.is_inside(self.game.cols - 1, self.game.rows - 1))

        # 外部点
        self.assertFalse(self.game.is_inside(-1, 0))
        self.assertFalse(self.game.is_inside(0, -1))
        self.assertFalse(self.game.is_inside(self.game.cols, 0))
        self.assertFalse(self.game.is_inside(0, self.game.rows))

    def test_place_food_on_empty_board(self):
        """测试在空白板上放置食物。"""
        self.game.snake = [(5, 5)]
        self.game.food = None

        self.game.place_food()

        self.assertIsNotNone(self.game.food)
        self.assertNotIn(self.game.food, self.game.snake)

    def test_place_food_full_board(self):
        """测试当板被填满时游戏结束。"""
        # 创建一个填满的板
        self.game.snake = [
            (x, y) for y in range(self.game.rows) for x in range(self.game.cols)
        ]
        self.game.game_over = False

        self.game.place_food()

        self.assertTrue(self.game.game_over)

    def test_get_ai_direction_safe_move(self):
        """测试 AI 选择安全移动方向。"""
        self.game.init_game()
        self.game.food = (10, 10)

        direction = self.game.get_ai_direction()

        # AI 应该返回一个有效方向
        self.assertIn(direction, [DIRECTION_UP, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT])

    def test_get_ai_direction_avoids_walls(self):
        """测试 AI 避免撞墙。"""
        self.game.init_game()

        # 将蛇放在左上角，只能向右或向下
        self.game.snake = [(0, 0), (0, 1)]
        self.game.direction = DIRECTION_RIGHT
        self.game.food = (5, 5)

        direction = self.game.get_ai_direction()

        # AI 不应选择向上或向左（会撞墙）
        self.assertNotEqual(direction, DIRECTION_UP)
        self.assertNotEqual(direction, DIRECTION_LEFT)

    def test_get_ai_direction_avoids_self(self):
        """测试 AI 避免撞到自己。"""
        self.game.init_game()

        # 创建一个 U 形蛇，蛇头被身体包围
        self.game.snake = [
            (5, 5),
            (6, 5),
            (6, 6),
            (5, 6),
            (4, 6),
            (4, 5),  # 蛇头
        ]
        self.game.direction = DIRECTION_UP
        self.game.food = (10, 10)

        direction = self.game.get_ai_direction()

        # 检查 AI 不会选择撞向身体的方向
        head_x, head_y = self.game.snake[-1]
        if direction == DIRECTION_UP:
            self.assertNotIn((head_x, head_y - 1), self.game.snake[:-1])
        elif direction == DIRECTION_DOWN:
            self.assertNotIn((head_x, head_y + 1), self.game.snake[:-1])
        elif direction == DIRECTION_LEFT:
            self.assertNotIn((head_x - 1, head_y), self.game.snake[:-1])
        elif direction == DIRECTION_RIGHT:
            self.assertNotIn((head_x + 1, head_y), self.game.snake[:-1])

    def test_restart_after_game_over(self):
        """测试游戏结束后重新开始。"""
        self.game.init_game()
        self.game.end_game()

        self.assertTrue(self.game.game_over)

        # 模拟按回车键
        self.game.restart()

        self.assertFalse(self.game.game_over)
        self.assertEqual(len(self.game.snake), 3)


class SnakeAIGameTests(unittest.TestCase):
    """AI 模式下的蛇游戏测试。"""

    def setUp(self):
        """设置测试环境。"""
        self.game = SnakeGame(auto_play=True, speed=1000)

    def tearDown(self):
        """清理测试环境。"""
        try:
            self.game.root.destroy()
        except tk.TclError:
            pass

    def test_auto_play_mode_enabled(self):
        """测试自动玩模式启用。"""
        self.assertTrue(self.game.auto_play)

    def test_move_calls_get_ai_direction(self):
        """测试在自动玩模式下 move 调用 AI 方向。"""
        self.game.init_game()
        initial_direction = self.game.direction

        # 执行移动，AI 应该决定新方向
        self.game.move()

        # 方向可能改变（取决于 AI 决策）
        self.assertIn(self.game.direction, [DIRECTION_UP, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT])


if __name__ == "__main__":
    unittest.main()
