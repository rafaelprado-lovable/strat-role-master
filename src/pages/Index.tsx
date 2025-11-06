import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Shield, UserCog, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: 'Organizações',
      description: 'Gerencie todas as organizações do sistema',
      path: '/organizations',
    },
    {
      icon: Shield,
      title: 'Permissões',
      description: 'Configure permissões e controles de acesso',
      path: '/permissions',
    },
    {
      icon: UserCog,
      title: 'Funções',
      description: 'Defina funções e privilégios',
      path: '/roles',
    },
    {
      icon: Users,
      title: 'Usuários',
      description: 'Administre os usuários do sistema',
      path: '/users',
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Heimdall
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema de Gerenciamento de Acesso e Permissões
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.path}
                onClick={() => navigate(feature.path)}
                className="group p-6 rounded-lg border border-border bg-card hover:border-primary transition-all duration-300 hover:shadow-lg text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
