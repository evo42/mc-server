import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorDisplay from '@/components/ErrorDisplay.vue'

describe('ErrorDisplay.vue', () => {
  it('renders error message when error prop is provided', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        error: 'Test error message'
      }
    })

    expect(wrapper.text()).toContain('Test error message')
    expect(wrapper.classes()).toContain('alert-danger')
  })

  it('renders error object message', () => {
    const errorObj = new Error('Test error object')
    const wrapper = mount(ErrorDisplay, {
      props: {
        error: errorObj
      }
    })

    expect(wrapper.text()).toContain('Test error object')
  })

  it('does not render when error prop is false', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        error: false
      }
    })

    expect(wrapper.exists()).toBe(false)
  })

  it('emits dismiss event when close button is clicked', async () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        error: 'Test error',
        showDismiss: true
      }
    })

    const closeButton = wrapper.find('.btn-close')
    await closeButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('dismiss')
  })

  it('does not show dismiss button when showDismiss is false', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        error: 'Test error',
        showDismiss: false
      }
    })

    expect(wrapper.find('.btn-close').exists()).toBe(false)
  })
})