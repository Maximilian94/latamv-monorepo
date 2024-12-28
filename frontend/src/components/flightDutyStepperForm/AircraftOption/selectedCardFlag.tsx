import CheckIcon from '@mui/icons-material/Check';

export const SelectedCardFlag = () => {
  return (
    <div
      className={
        'absolute top-0 right-0 w-7 h-7 flex justify-center items-center'
      }
    >
      <CheckIcon className="z-10 text-sm" />
      <div
        className={
          'absolute bg-green-600 w-14 h-10 transform rotate-45 translate-x-2 -translate-y-2'
        }
      ></div>
    </div>
  );
};
