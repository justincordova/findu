import { render } from "@testing-library/react-native";
import Home from "../index";

describe("<Home />", () => {
  test("Text renders correctly on HomeScreen", () => {
    const { getByText } = render(<Home />);
    getByText("FindU");
    getByText("Dating App for Verified College Students Only");
    getByText("Discover real connections on your campus.");
  });
});