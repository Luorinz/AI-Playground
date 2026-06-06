import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App.jsx'

describe('App 集成测试', () => {
  it('初始显示开始游戏覆盖层', () => {
    render(<App />)
    expect(screen.getByText('俄罗斯方块')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-idle')).toBeInTheDocument()
    expect(screen.getByText('开始游戏')).toBeInTheDocument()
  })

  it('点击开始后隐藏覆盖层并显示暂停按钮', () => {
    render(<App />)
    fireEvent.click(screen.getByText('开始游戏'))
    expect(screen.queryByTestId('overlay-idle')).not.toBeInTheDocument()
    expect(screen.getByText('暂停 / 继续')).toBeInTheDocument()
  })

  it('开始后分数初始为 0', () => {
    render(<App />)
    fireEvent.click(screen.getByText('开始游戏'))
    expect(screen.getByTestId('score')).toHaveTextContent('0')
    expect(screen.getByTestId('level')).toHaveTextContent('1')
  })

  it('渲染游戏面板', () => {
    render(<App />)
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })
})
