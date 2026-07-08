import { Button } from "@sol/ui";
import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation("client");

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        {t("scaffold.title")}
      </h1>
      <Button>{t("scaffold.testButton")}</Button>
    </div>
  );
}

export default App;
