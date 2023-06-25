import Link from "next/link";
import Image from "next/image";
import SearchBox from "./SearchBox";
import { logo } from "@/util";
import SearchHeaderOptions from "./SearchHeaderOptions";


export default function SearchHeader() {
  return (
    <header className="sticky top-0 bg-white">
      <div className="flex w-full p-6 items-center justify-between">
        <Link href={"/"}>
            <Image
              width="120"
              height="40"
              src={`/logo${logo()}.png`}
            />
        </Link>
        <div className="flex-1">
          <SearchBox />
        </div>
      </div>
      <SearchHeaderOptions />
    </header>
  );
}
