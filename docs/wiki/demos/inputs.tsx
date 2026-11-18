// inputs：输入进阶演示
import { useState, type CSSProperties } from 'react'
import { Demo, type DemoSection } from './demo-cell.tsx'
import {
  Select, Combobox, Slider, RadioGroup, InputOtp, Calendar, DatePicker, Form, Field, Input, Button,
} from '../../../src/index.ts'

function SelectSection() {
  const [value, setValue] = useState('all')
  return (
    <Demo id="select" title="Select" code={`import { Select } from '../ui/select.tsx'

<Select value={value} onChange={setValue}
  options={[{ value: 'all', label: '全部' }, …]} />`}>
      <div style={{ width: 200 }}>
        <Select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          options={[
            { value: 'all', label: '全部记忆' },
            { value: 'confirmed', label: '已确认' },
            { value: 'pending', label: '待确认' },
          ]}
        />
      </div>
    </Demo>
  )
}

function ComboboxSection() {
  const [value, setValue] = useState('')
  return (
    <Demo id="combobox" title="Combobox" code={`import { Combobox } from '../ui/combobox.tsx'

<Combobox value={value} onValueChange={setValue} options={…}
  placeholder="输入以筛选…" />`}>
      <div style={{ width: 220 }}>
        <Combobox
          value={value}
          onValueChange={setValue}
          placeholder="搜索记忆标签…"
          options={[
            { value: 'dark', label: '深色主题偏好' },
            { value: 'chinese', label: '简体中文回复' },
            { value: 'pilot', label: 'pilot 项目管理' },
            { value: 'demo', label: '演示项目' },
          ]}
        />
      </div>
    </Demo>
  )
}

function SliderSection() {
  const [value, setValue] = useState(60)
  return (
    <Demo id="slider" title="Slider" code={`import { Slider } from '../ui/slider.tsx'

<Slider value={value} onValueChange={setValue} min={0} max={100} />`}>
      <div style={{ width: 220 }}>
        <Slider value={value} onValueChange={setValue} min={0} max={100} />
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 'var(--dsh-space-6)' }}>当前值：{value}</div>
      </div>
    </Demo>
  )
}

function RadioGroupSection() {
  const [value, setValue] = useState('daily')
  return (
    <Demo id="radio-group" title="RadioGroup" code={`import { RadioGroup } from '../ui/radio-group.tsx'

<RadioGroup value={value} onValueChange={setValue} name="digest"
  options={[{ value: 'daily', label: '每天' }, …]} />`}>
      <RadioGroup
        value={value}
        onValueChange={setValue}
        name="digest"
        options={[
          { value: 'daily', label: '每天摘要' },
          { value: 'weekly', label: '每周摘要' },
          { value: 'off', label: '关闭摘要' },
        ]}
      />
    </Demo>
  )
}

function InputOtpSection() {
  const [value, setValue] = useState('')
  return (
    <Demo id="input-otp" title="InputOtp" code={`import { InputOtp } from '../ui/input-otp.tsx'

<InputOtp length={6} value={value} onChange={setValue}
  onComplete={(code) => console.log(code)} />`}>
      <div>
        <InputOtp length={6} value={value} onChange={setValue} />
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 'var(--dsh-space-8)' }}>
          {value.length === 6 ? '已填满：' + value : '直接敲数字（点格子或按退格）'}
        </div>
      </div>
    </Demo>
  )
}

function CalendarSection() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date | undefined>(new Date())
  const cap = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', textAlign: 'center' } as CSSProperties
  return (
    <Demo id="calendar" title="Calendar" wide code={`import { Calendar } from '../ui/calendar.tsx'

<Calendar selected={selected} onSelect={setSelected} />
<Calendar mode="month" selected={month} onSelect={setMonth} />`}>
      <div style={{ display: 'flex', gap: 'var(--dsh-space-24)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Calendar selected={selected} onSelect={setSelected} />
          <span style={cap}>day 日历（缺省）</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)' }}>
          <Calendar mode="month" selected={month} onSelect={setMonth} />
          <span style={cap}>month 年格：十二月，‹ › 按年翻，选中只看年月</span>
        </div>
      </div>
    </Demo>
  )
}

function DatePickerSection() {
  const [value, setValue] = useState('')
  const [monthValue, setMonthValue] = useState('')
  const cap = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } as CSSProperties
  return (
    <Demo id="date-picker" title="DatePicker" wide code={`import { DatePicker } from '../ui/date-picker.tsx'

<DatePicker value={value} onChange={setValue} placeholder="选择日期" />
<DatePicker mode="month" value={monthValue} onChange={setMonthValue} />`}>
      <div style={{ display: 'flex', gap: 'var(--dsh-space-24)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)', width: 220 }}>
          <DatePicker value={value} onChange={setValue} placeholder="选择日期" />
          <span style={cap}>day（缺省）：值 YYYY-MM-DD</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--dsh-space-4)', width: 220 }}>
          <DatePicker mode="month" value={monthValue} onChange={setMonthValue} />
          <span style={cap}>month：值 YYYY-MM，占位自动「选择月份」</span>
        </div>
      </div>
      <p style={{ margin: 'var(--dsh-space-12) 0 0', fontSize: 12, lineHeight: 1.8, color: 'var(--dsw-alias-label-tertiary)' }}>
        两个组件都有 <code>mode=&quot;month&quot;</code> 的月份选择形态（issue 010）：
        Calendar 变十二月年格（‹ › 按年翻、禁用回调按月生效），
        DatePicker 的弹层换年格、值格式换 YYYY-MM、占位自动「选择月份」。
        今日 / 选中态与 day 模式共用同一组 token。
      </p>
    </Demo>
  )
}

function FormSection() {
  const [submitted, setSubmitted] = useState<string | undefined>()
  return (
    <Demo id="form" title="Form" wide code={`import { Form } from '../ui/form.tsx'

<Form onSubmit={async () => { … }} disableWhilePending>
  <Field …>控件</Field>
  <Button variant="primary">提交</Button>
</Form>`}>
      <div style={{ width: 300 }}>
        <Form
          disableWhilePending
          onSubmit={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600))
            setSubmitted(new Date().toLocaleTimeString('zh-CN'))
          }}
        >
          <Field name="f-title" label="记忆标题" description="提交期整表禁用（data-pending）">
            <Input defaultValue="示例记忆" />
          </Field>
          <Button variant="primary" size="sm" type="submit">提交</Button>
        </Form>
        {submitted !== undefined && <div style={{ fontSize: 12, color: 'var(--dsw-alias-state-success-primary)', marginTop: 'var(--dsh-space-8)' }}>已提交于 {submitted}</div>}
      </div>
    </Demo>
  )
}

export const inputSections: DemoSection = {
  group: '输入进阶',
  items: [
    { id: 'select', title: 'Select' },
    { id: 'combobox', title: 'Combobox' },
    { id: 'slider', title: 'Slider' },
    { id: 'radio-group', title: 'RadioGroup' },
    { id: 'input-otp', title: 'InputOtp' },
    { id: 'calendar', title: 'Calendar' },
    { id: 'date-picker', title: 'DatePicker' },
    { id: 'form', title: 'Form' },
  ],
  node: (
    <>
      <SelectSection />
      <ComboboxSection />
      <SliderSection />
      <RadioGroupSection />
      <InputOtpSection />
      <CalendarSection />
      <DatePickerSection />
      <FormSection />
    </>
  ),
}
