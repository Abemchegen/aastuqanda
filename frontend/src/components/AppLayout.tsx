import { ReactNode, useState } from "react";
import { Header } from "@/components/Header";
import { SpaceSidebar } from "@/components/SpaceSidebar";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children?: ReactNode;
  selectedSpace?: string | null;
  onSelectSpace?: (slug: string | null) => void;
  onCreatePost?: () => void;
}

export function AppLayout({
  children,
  selectedSpace = null,
  onSelectSpace,
  onCreatePost,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [internalSelectedSpace, setInternalSelectedSpace] = useState<
    string | null
  >(selectedSpace);

  const handleSelectSpace = (slug: string | null) => {
    setInternalSelectedSpace(slug);
    // Navigate based on selection
    if (!slug) {
      navigate("/");
    } else if (slug === "explore") {
      navigate("/explore");
    } else {
      navigate(`/space/${slug}`);
    }
    onSelectSpace?.(slug);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onCreatePost={onCreatePost}
        showCreateButton={false}
      />

      <div className="flex">
        <SpaceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedSpace={internalSelectedSpace}
          onSelectSpace={handleSelectSpace}
        />

        <div className="flex-1 min-w-0">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
}

export default AppLayout;
