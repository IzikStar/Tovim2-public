import SinglesView from "../components/SinglesView";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Single } from "../utils/types";

const Public: React.FC = () => {
  const { matchMakerId } = useAuth();

  const addToPrivate = async (single: Single) => {
    await apiService.addSingleToMatchmaker(matchMakerId!, single.id);
  };

  return (
    <SinglesView
      fetchSingles={() => apiService.getPublicSingles()}
      onAddToPrivate={addToPrivate}
    />
  );
};

export default Public;
