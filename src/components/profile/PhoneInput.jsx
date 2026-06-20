import { TextField } from '@mui/material';
import { IMaskInput } from 'react-imask';
import { forwardRef } from 'react';

const PhoneMaskAdapter = forwardRef(function PhoneMaskAdapter(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="+{0}000000000000000"
      definitions={{ '0': /[0-9]/ }}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

export default function PhoneInput({ value, onChange, name = 'phone', ...rest }) {
  return (
    <TextField
      name={name}
      value={value}
      onChange={onChange}
      slotProps={{
        input: {
          inputComponent: PhoneMaskAdapter,
        },
      }}
      placeholder="+7 999 123 45 67"
      {...rest}
    />
  );
}