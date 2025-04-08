import IconGroup from '../components/IconGroup';
import { 
  Home, 
  Eraser, 
  SaveIcon, 
  ArrowLeftCircle, 
  ArrowRightCircle 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom'; // Removed Link


// Define the props interface
interface IconsProps {
  onEraseClick?: () => void;
  onSaveClick?: () => void; // Optional as it does nothing for now
  onBackClick?: () => void;
  onNextClick?: () => void;
}


const Icons: React.FC<IconsProps> = ({
  onEraseClick,
  onSaveClick,
  onBackClick,
  onNextClick
}) => {

  const navigate = useNavigate();
  return (
    <div className="Icons=theme flex flex-col mb-6">
      <IconGroup
        icons={[
          { icon: Home, label: "Início", variant: "primary", onClick: () => navigate('/telaInicial') }, // Home is always the same
          { icon: Eraser, label: "Apagar", variant: "secondary", onClick: onEraseClick },
          { icon: SaveIcon, label: "Salvar", variant: "primary", onClick: onSaveClick }, // Does nothing for now
          { icon: ArrowLeftCircle, label: "Anterior", variant: "secondary", onClick: onBackClick },
          { icon: ArrowRightCircle, label: "Próximo", variant: "primary", onClick: onNextClick }
        ]}
        className="self-end text-xs"
      />
    </div>
  );
};

export default Icons;
