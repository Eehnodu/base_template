import Modal from "@/component/admin/ui/feedback/modal";

interface LoginErrorModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginErrorModal = ({ open, onClose }: LoginErrorModalProps) => {
  return (
    <Modal
      buttonCount={1}
      open={open}
      title="로그인 실패"
      description="계정 정보가 일치하지 않습니다."
      onClose={onClose}
    />
  );
};

export default LoginErrorModal;