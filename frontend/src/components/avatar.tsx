export default function Avatar({ online }: { online: boolean }) {
  return (
    <div className="flex relative">
      <img
        alt=""
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        className={`h-12 w-12 rounded-md ${!online && 'grayscale'}`}
      />
      <div className="absolute bottom-1.5 right-1.5 block translate-x-1/2 translate-y-1/2 transform rounded-full border-solid border-2 border-slate-200">
        <div
          className={`block h-2 w-2 rounded-full ${online && 'bg-green-400'}`}
        />
      </div>
    </div>
  );
}
