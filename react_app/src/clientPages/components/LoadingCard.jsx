import Icon from "../../components/AppIcon";

export default function LoadingCard({ text = "Cargando...", iconSize = 36 }) {
   return (
      <div className="bg-card rounded-lg border border-border shadow-subtle p-8 sm:p-12 text-center text-muted-foreground">
         <Icon name="Loader" size={iconSize} className="animate-spin mx-auto mb-3 text-primary" />
         <span className="text-sm sm:text-base">{text}</span>
      </div>
   );
}
