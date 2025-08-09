import { useDebouncedCallback } from "use-debounce";

exprot const debounceValidateUsername = useDebouncedCallback(async () => {
    if (errors.userName && errors.userName.type !== 'manual') {
      return;
    }

    try {
      setValidationName(true);
      const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(username))
        .data;
      if (!isValid) {
        setError('userName', {
          type: 'manual',
          message: 'This username is already in use. Try another one.',
        });
      } else {
        clearErrors('userName');
      }
    } finally {
      setValidationName(false);
    }
  }, 1000);