import { useNavigate } from "react-router-dom";
import ShopFlowList from "./ShopFlowList";

export default function ShopFlow() {
  const navigate = useNavigate();
  return <ShopFlowList />;
}
