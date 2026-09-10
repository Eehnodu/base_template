import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import InputBox from "@/component/client/ui/form/inputbox";
import Button from "@/component/client/ui/form/button";

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPw: boolean;
  setShowPw: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPw,
  setShowPw,
  onSubmit
}: LoginFormProps) => {
  return (
    <div className="w-1/3 flex items-center justify-center px-20 relative">
      <div className="w-full max-w-sm flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <h3 className="text-4xl font-bold tracking-tight text-text-main">관리자 로그인</h3>
          <p className="text-text-sub font-medium">서비스 관리를 위해 로그인이 필요합니다.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <InputBox
                type="email"
                value={email}
                placeholder="이메일 주소"
                onChange={(val) => setEmail(val)}
                className="bg-input-bg transition-all"
                leftIcon={<Mail className="w-5 h-5 text-text-sub" />}
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <InputBox
                type={showPw ? "text" : "password"}
                value={password}
                placeholder="비밀번호"
                onChange={(val) => setPassword(val)}
                className="bg-input-bg transition-all"
                leftIcon={<Lock className="w-5 h-5 text-text-sub" />}
                onRightIconClick={() => setShowPw(!showPw)}
                rightIcon={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPw(!showPw);
                    }}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                  >
                    {showPw ? (
                      <Eye className="w-5 h-5 text-text-sub" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-text-sub" />
                    )}
                  </button>
                }
              />
            </div>
          </div>

          <Button
            variant="main"
            full
            type="submit"
            disabled={!email || !password}
            className="font-semibold shadow-md active:scale-[0.98] transition-transform"
          >
            로그인
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
