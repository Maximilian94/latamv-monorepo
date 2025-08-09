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
import {
  Path,
  FieldErrors,
  ControllerRenderProps,
  FieldValues,
} from 'react-hook-form';

type PasswordInputProps<
  TFieldValues extends FieldValues,
  TFieldName extends Path<TFieldValues>,
> = {
  errors: FieldErrors<TFieldValues>;
  field: ControllerRenderProps<TFieldValues, TFieldName>;
  autoFocus?: boolean;
} & OutlinedInputProps;

export const PasswordInput = <
  TFieldValues extends FieldValues,
  TFieldName extends Path<TFieldValues>,
>({
  errors,
  field,
  autoFocus,
  ...outlinedProps
}: PasswordInputProps<TFieldValues, TFieldName>) => {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    // <FormControl
    //   className={errors[field.name] ? 'animate-shake' : ''}
    //   error={!!errors[field.name]}
    //   size={'small'}
    // >
    //   <InputLabel
    //     htmlFor={`id-${field.name}`}
    //     size={outlinedProps?.size === 'small' ? 'small' : 'normal'}
    //   >
    //     {outlinedProps.label || 'Password'}
    //   </InputLabel>
    //   <OutlinedInput
    //     id={`id-${field.name}`}
    //     label={outlinedProps.label || 'Password'}
    //     {...field}
    //     type={showPassword ? 'text' : 'password'}
    //     endAdornment={
    //       <InputAdornment position="end">
    //         <IconButton
    //           aria-label="toggle password visibility"
    //           onClick={handleClickShowPassword}
    //           edge="end"
    //           sx={{
    //             outline: 'none',
    //             '&:focus': {
    //               outline: 'none',
    //               boxShadow: 'none',
    //             },
    //           }}
    //         >
    //           {showPassword ? <VisibilityOff /> : <Visibility />}
    //         </IconButton>
    //       </InputAdornment>
    //     }
    //     {...outlinedProps}
    //   ></OutlinedInput>
    //   <FormHelperText id={`id-${field.name}-helper-text`}>
    //     {errors[field.name] ? (errors[field.name]?.message as string) : ' '}
    //   </FormHelperText>
    // </FormControl>

    <FormControl
      className={`w-full ${errors[field.name] ? 'animate-shake' : ''}`}
      variant="outlined"
      size={outlinedProps?.size === 'small' ? 'small' : 'medium'}
      error={!!errors[field.name]}
      autoFocus={autoFocus}
    >
      <InputLabel htmlFor={`id-${field.name}`} size={outlinedProps?.size === 'small' ? 'small' : 'normal'}>{outlinedProps.label || 'Password'}</InputLabel>
      <OutlinedInput
        id={`id-${field.name}`}
        label={outlinedProps.label || 'Password'}
        {...field}
        type={showPassword ? 'text' : 'password'}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label={
                showPassword ? 'hide the password' : 'display the password'
              }
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              onMouseUp={handleMouseUpPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
      />
      <FormHelperText id={`id-${field.name}-helper-text`}>
        {errors[field.name] ? (errors[field.name]?.message as string) : ' '}
      </FormHelperText>
    </FormControl>
  );
};

export default PasswordInput;
