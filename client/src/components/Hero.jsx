import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div
      className="px-4 sm:px-20 xl:px-32 relative flex flex-col items-center justify-center w-full min-h-screen bg-[url('/gradientBackground.png')] bg-cover bg-no-repeat"
    >
      {/* Text Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight mb-6">
          Create amazing content <br />
          with <span className="text-primary">AI tools</span>
        </h1>

        <p className="mt-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto text-gray-600">
          Generate articles, blog titles, images, and more with Him.Ai tools.
          The best way to create content with AI. <br />
          Transform your ideas into reality.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <button
          onClick={() => navigate("/ai")}
          className="bg-primary text-white px-8 py-3 rounded-lg hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
        >
          Start creating now
        </button>

        <button className="bg-white px-8 py-3 rounded-lg border border-gray-200 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer">
          Watch demo
        </button>
      </div>
      <div className='flex items-center gap-4 mt-8 mx-auto text-gray-600'>
        <img src={assets.user_group} alt="" className='h-8 ' /> Trusted by 10k+ users
      </div>
    </div>
  );
};

export default Hero;