import sex, { Token } from "./sex";

const parseSex = (str: string) => {
  for (const iterator of sex(str as unknown as Token[])) {
    console.log(iterator);
  }
};

export default parseSex;
