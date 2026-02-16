import unittest
import tkinter as tk
from  import SnakeGame


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


if __name__ == "__main__":
    unittest.main()

