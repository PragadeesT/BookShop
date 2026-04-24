export const saveToken = (token: string) => {
    localStorage.setItem("token", token);
    document.cookie = `token=${token}; path=/; max-age=3600`;
  };
  
  export const removeToken = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
  };
  
  export const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  export const isLoggedIn = () => !!getToken();