import { Toast, toast } from "react-hot-toast";
import { Avatar, IconButton, Typography } from "@mui/material";
import { User } from "../services/auth.service.ts";
import CancelIcon from "@mui/icons-material/Cancel";

export const SnackBar = ({ t, user }: { t: Toast; user: User | undefined }) => {
  const closeToask = () => {
    console.log(t);
    console.log("id", t.id);
    toast.dismiss(t.id);
    console.log("Aoba");
  };
  return (
    <div
      className={`${t.visible ? "animate-enter" : "animate-leave"} bg-white rounded-md p-2 shadow-lg`}
    >
      <div className={"flex gap-1 items-center h-full"}>
        <div>
          <Avatar
            className={"h-10 w-10"}
            variant="rounded"
            alt="Remy Sharp"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          />
        </div>
        <div className={"flex flex-col h-full justify-center"}>
          <Typography variant={"subtitle1"} lineHeight={1}>
            {user?.name}
          </Typography>
          <Typography variant={"subtitle2"} lineHeight={1}>
            Acabou de se conectar
          </Typography>
        </div>
        <div>
          <IconButton aria-label="delete" size="small" onClick={closeToask}>
            <CancelIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </div>

    // <div
    //   className={`${
    //     t.visible ? "animate-enter" : "animate-leave"
    //   } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    // >
    //   <div className="flex-1 w-0 p-4">
    //     <div className="flex items-start">
    //       <div className="flex-shrink-0 pt-0.5">
    //         <img
    //           className="h-10 w-10 rounded-full"
    //           src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=6GHAjsWpt9&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80"
    //           alt=""
    //         />
    //       </div>
    //       <div className="ml-3 flex-1">
    //         <p className="text-sm font-medium text-gray-900">
    //           {user.name} foi conectado
    //         </p>
    //         <p className="mt-1 text-sm text-gray-500">
    //           Sure! 8:30pm works great!
    //         </p>
    //       </div>
    //     </div>
    //   </div>
    //   <div className="flex border-l border-gray-200">
    //     <button
    //       onClick={() => toast.dismiss(t.id)}
    //       className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    //     >
    //       Close
    //     </button>
    //   </div>
    // </div>
  );
};
