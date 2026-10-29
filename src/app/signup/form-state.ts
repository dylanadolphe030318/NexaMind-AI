export type SignUpState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialSignUpState: SignUpState = {
  status: "idle",
  message: "",
};
