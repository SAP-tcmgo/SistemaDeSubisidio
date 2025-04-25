import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/components/ui/lib/utils"; // Import cn utility

// Define the possible steps in the analysis process
type AnaliseStep = 'Município e Responsáveis' | 'Tratamento Processo' | 'Fixação';

// Props for the BreadcrumbNav component
interface BreadcrumbNavProps {
  currentPage: AnaliseStep;
  // sidebarOpen prop might not be needed if centering is always applied,
  // but kept for potential future adjustments.
  sidebarOpen: boolean;
}

// Define the sequence and paths for the analysis steps
const analysisSteps: { name: AnaliseStep; path: string }[] = [
  { name: 'Município e Responsáveis', path: '/MunicipioEResponsaveis' },
  { name: 'Tratamento Processo', path: '/TratamentoProcesso' },
  { name: 'Fixação', path: '/Fixacao' },
];

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ currentPage, sidebarOpen, ...props }) => {
  // Find the index of the current page in the steps array
  const currentIndex = analysisSteps.findIndex(step => step.name === currentPage);

  return (
    // Use flexbox to center the breadcrumb container
    <div className={cn(
      "flex justify-center px-4 py-3 transition-all duration-300",
      // Conditional margin based on sidebar state (optional if centering is sufficient)
      // sidebarOpen ? 'ml-64' : 'ml-0'
    )}>
      <Breadcrumb>
        <BreadcrumbList>
          {/* Map through the defined analysis steps */}
          {analysisSteps.map((step, index) => (
            <BreadcrumbItem key={index}>
              {index < currentIndex ? (
                // Render previous steps as links
                <BreadcrumbLink asChild>
                  <Link to={step.path} className="text-muted-foreground hover:text-foreground">
                    {step.name}
                  </Link>
                </BreadcrumbLink>
              ) : ( // All steps are links now
                <BreadcrumbLink asChild>
                  <Link
                    to={step.path}
                    className={cn(
                      "hover:text-foreground",
                      index === currentIndex ? "font-semibold text-foreground" : "text-muted-foreground" // Style current differently
                    )}
                    aria-current={index === currentIndex ? "page" : undefined} // Add aria-current for accessibility
                  >
                    {step.name}
                  </Link>
                </BreadcrumbLink>
              )}
              {/* Add a separator between items, except after the last one */}
              {index < analysisSteps.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default BreadcrumbNav;
