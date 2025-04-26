import React from "react";
import { Link } from "react-router-dom";

const Card = ({ title, description, icon: Icon, to, className = "", iconSize = "w-9 h-9" }) => {
  const CardContent = (
    <div
      className={`p-10 bg-gray-800 text-white shadow-lg rounded-lg flex items-center justify-between min-h-24 w-full transition-transform hover:scale-105 ${className}`}
      role="button"
      aria-label={title}
    >
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      {Icon && <Icon className={`${iconSize}`} />}
    </div>
  );

  return to ? <Link to={to}>{CardContent}</Link> : CardContent;
};

export default Card;
