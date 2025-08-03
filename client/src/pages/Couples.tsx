import SinglesView from "../components/SinglesView";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const Couples: React.FC = () => {
  const { matchMakerId } = useAuth();
  return (
    <SinglesView
      fetchSingles={() => apiService.getMarriedSingles(matchMakerId!)}
    />
  );
};

export default Couples;
