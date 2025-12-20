import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAPI } from "@/hooks/use-api";
import { Space } from "@/types";
import { Users, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Explore() {
  const { fetchSpaces } = useAPI();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchSpaces();
      if (Array.isArray(res)) setSpaces(res);
      setLoading(false);
    })();
  }, []);

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Explore Spaces
          </h1>
          <p className="text-muted-foreground">
            Discover communities and join conversations that interest you
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <Input
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card"
          />
        </div>

        {/* Spaces Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No spaces found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <Link key={space.id} to={`/space/${space.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{space.icon || "🌐"}</span>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          <span className="text-space-prefix">loop/</span>
                          {space.slug}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          {space.memberCount?.toLocaleString() || 0} members
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {space.description || "A community for discussions"}
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      View space <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
