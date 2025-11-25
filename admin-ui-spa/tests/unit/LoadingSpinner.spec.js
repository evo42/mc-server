import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

describe('LoadingSpinner.vue', () => {
  it('renders loading text when loading is true', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        loading: true,
        loadingText: 'Loading data...'
      }
    })

    expect(wrapper.text()).toContain('Loading data...')
    expect(wrapper.find('.spinner-border').exists()).toBe(true)
  })

  it('does not render when loading is false', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        loading: false,
        loadingText: 'Loading data...'
      }
    })

    expect(wrapper.text()).not.toContain('Loading data...')
    expect(wrapper.find('.spinner-border').exists()).toBe(false)
  })

  it('uses default loading text when not provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        loading: true
      }
    })

    expect(wrapper.text()).toContain('Loading...')
  })

  it('applies container class correctly', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        loading: true,
        containerClass: 'my-5 custom-class'
      }
    })

    expect(wrapper.classes()).toContain('my-5')
    expect(wrapper.classes()).toContain('custom-class')
  })
})