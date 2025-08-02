import SinglesView from "../components/SinglesView";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const { matchMakerId } = useAuth();
  return (
    <SinglesView
      fetchSingles={() => apiService.getPrivateSingles(matchMakerId!)}
    />
  );
};

export default Dashboard;
