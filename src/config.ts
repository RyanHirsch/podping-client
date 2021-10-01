import dotenv from "dotenv";

dotenv.config();

const level = (() => {
  if (process.env.LOG) {
    return process.env.LOG;
  }
  if (process.env.NODE_ENV === "production") {
    return "warn";
  }
  return "info";
})();

export default {
  level,
  ignoreEnd:
    (process.env.NODE_ENV === "production" || Boolean(process.env.IGNORE_END)) &&
    !process.env.ALLOW_END,
};
