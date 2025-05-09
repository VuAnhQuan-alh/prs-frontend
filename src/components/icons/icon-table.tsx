export default function IconTable({ active }: { active?: boolean }) {
  const color = active ? "#228ED0" : "#262F33";
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.6"
        d="M22 7.81V12H9V2H16.19C19.83 2 22 4.17 22 7.81Z"
        fill={color}
      />
      <path
        d="M9 2V22H7.81C4.17 22 2 19.83 2 16.19V7.81C2 4.17 4.17 2 7.81 2H9Z"
        fill={color}
      />
      <path
        opacity="0.4"
        d="M22 12V16.19C22 19.83 19.83 22 16.19 22H9V12H22Z"
        fill={color}
      />
    </svg>
  );
}
