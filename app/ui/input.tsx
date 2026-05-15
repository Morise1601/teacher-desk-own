// import React, { ReactNode } from 'react';
// import { UseFormRegister } from 'react-hook-form';

// interface InputProps {
//   type?: string;
//   placeholder: string;
//   name: string;
//   login: UseFormRegister<any>;
//   register: UseFormRegister<any>;
//   icon?: ReactNode;
//   error?: string;
// }

// const Input: React.FC<InputProps> = ({
//   type = 'text',
//   placeholder,
//   name,
//   login,
//   register,
//   icon,
//   error,
// }) => {
//   return (
//     <div className="relative w-full">
//       <input
//         type={type}
//         {...register(name)}
//         placeholder={placeholder}
//         className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
//       />
//       {icon && <span className="absolute left-3 top-2.5 text-gray-500">{icon}</span>}
//       {error && <p className="text-sm text-red-500 mt-1 ml-1">{error}</p>}
//     </div>
//   );
// };

// export default Input;
