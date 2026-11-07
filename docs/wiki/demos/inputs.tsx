// inputs：输入进阶演示
import { useState } from 'react'
import { Demo, type DemoSection } from '../demo-cell.tsx'
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
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 6 }}>当前值：{value}</div>
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
        <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 8 }}>
          {value.length === 6 ? '已填满：' + value : '直接敲数字（点格子或按退格）'}
        </div>
      </div>
    </Demo>
  )
}

function CalendarSection() {
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  return (
    <Demo id="calendar" title="Calendar" code={`import { Calendar } from '../ui/calendar.tsx'

<Calendar selected={selected} onSelect={setSelected} />`}>
      <Calendar selected={selected} onSelect={setSelected} />
    </Demo>
  )
}

function DatePickerSection() {
  const [value, setValue] = useState('')
  return (
    <Demo id="date-picker" title="DatePicker" code={`import { DatePicker } from '../ui/date-picker.tsx'

<DatePicker value={value} onChange={setValue} placeholder="选择日期" />`}>
      <div style={{ width: 200 }}>
        <DatePicker value={value} onChange={setValue} placeholder="选择日期" />
      </div>
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
        {submitted !== undefined && <div style={{ fontSize: 12, color: 'var(--dsw-alias-state-success-primary)', marginTop: 8 }}>已提交于 {submitted}</div>}
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
