import React from 'react';

const Avatar = ({ user, size = "w-10 h-10", textSize = "text-sm" }) => {
  // If user has an uploaded image, show it
  if (user?.avatar) {
    return <img src={user.avatar} className={`${size} rounded-full object-cover border dark:border-gray-700`} alt="avatar" />;
  }

  // Otherwise, generate initials
  const name = user?.name || user?.username || "?";
  const initial = name.charAt(0).toUpperCase();

  // Generate a consistent background color based on name length (pseudo-random)
  const colors = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`${size} rounded-full ${bgColor} flex items-center justify-center text-white font-bold ${textSize} shadow-sm`}>
      {initial}
    </div>
  );
};

export default Avatar;
