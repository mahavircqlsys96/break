import { useQuery } from "@tanstack/react-query";
import { masterData } from "@/services";

/** Lookup lists used by filters and forms across modules. */
export function useMasterData() {
  const categories = useQuery({
    queryKey: ["md", "categories"],
    queryFn: masterData.categories.all,
  });
  const cities = useQuery({
    queryKey: ["md", "cities"],
    queryFn: masterData.cities.all,
  });
  const amenities = useQuery({
    queryKey: ["md", "amenities"],
    queryFn: masterData.amenities.all,
  });
  const animals = useQuery({
    queryKey: ["md", "animals"],
    queryFn: masterData.animals.all,
  });
  const policies = useQuery({
    queryKey: ["md", "policies"],
    queryFn: masterData.policies.all,
  });
  return {
    categories: categories.data ?? [],
    cities: cities.data ?? [],
    amenities: amenities.data ?? [],
    animals: animals.data ?? [],
    policies: policies.data ?? [],
    ready: !!(
      categories.data &&
      cities.data &&
      amenities.data &&
      animals.data &&
      policies.data
    ),
  };
}
