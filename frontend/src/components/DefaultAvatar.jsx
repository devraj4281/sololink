import { useState } from "react";

const Avatar = ({ src, alt, size = "w-11 h-11" }) => {
  const defaultPath = "/avatar.png";
  const [imgSrc, setImgSrc] = useState(src || defaultPath);

  return (
    <img
      src={imgSrc}
      alt={alt || "User profile"}
      className={`${size} shrink-0 rounded-full border border-base-300 object-cover`}
      onError={() => {
        if (imgSrc !== defaultPath) {
          setImgSrc(defaultPath);
        }
      }}
    />
  );
};

export default Avatar;