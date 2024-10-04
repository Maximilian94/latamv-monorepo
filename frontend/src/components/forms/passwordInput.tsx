import { useState } from 'react';
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ControllerRenderProps, FieldErrors } from 'react-hook-form';

type PasswordInputProps = {
  errors: FieldErrors<any>;
  field: ControllerRenderProps<any, any>;
} & OutlinedInputProps;

export const PasswordInput = ({
  errors,
  field,
  ...outlinedProps
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <FormControl
      className={errors[field.name] ? 'animate-shake' : ''}
      error={!!errors[field.name]}
    >
      <InputLabel
        htmlFor={`id-${field.name}`}
        size={outlinedProps?.size == 'small' ? 'small' : 'normal'}
      >
        {outlinedProps.label || 'Password'}
      </InputLabel>
      <OutlinedInput
        id={`id-${field.name}`}
        label={outlinedProps.label || 'Password'}
        {...field}
        type={showPassword ? 'text' : 'password'}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              edge="end"
              sx={{
                outline: 'none',
                '&:focus': {
                  outline: 'none',
                  boxShadow: 'none',
                },
              }}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        {...outlinedProps}
      ></OutlinedInput>
      <FormHelperText id={`id-${field.name}-helper-text`}>
        {errors[field.name] ? (errors[field.name]?.message as string) : ' '}
      </FormHelperText>
    </FormControl>
  );
};

export default PasswordInput;
