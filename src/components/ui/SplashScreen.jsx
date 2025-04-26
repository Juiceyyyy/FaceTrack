import { useEffect } from "react";
import { motion } from "framer-motion";
import logo from "../ui/logo.png"; 

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Logo Animation */}
      <motion.img
        src={logo}
        alt="App Logo"
        className="w-24 h-24 mb-4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Text Animation */}
      <motion.h1
        className="text-4xl font-bold"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Face Recognition App
      </motion.h1>
    </motion.div>
  );
};

export default SplashScreen;
