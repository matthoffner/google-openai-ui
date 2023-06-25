import HomeHeader from "@/components/HomeHeader";
import HomeSearch from "@/components/HomeSearch";
import { logo } from "@/util";
import Image from "next/image";
import "@/app/globals.css";

export default function Home() {
  return (
    <>
      {/* Header */}
      <HomeHeader />

      {/* body */}

      <div className="flex flex-col items-center mt-24">
        <Image
          width="300"
          height="100"
          src={`/logo${logo()}.png`}
        />

        <HomeSearch/>
      </div>
    </>
  );
}