"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Users, Star, Download, Filter } from "lucide-react";

interface PublicStudySet {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  termCount: number;
  category: string;
  rating: number;
  downloads: number;
  createdAt: string;
  tags: string[];
}

interface PublicStudySetBrowserProps {
  onStudySetClick?: (studySetId: string) => void;
}

export function PublicStudySetBrowser({ onStudySetClick }: PublicStudySetBrowserProps) {
  const [studySets, setStudySets] = useState<PublicStudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "rating">("popular");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStudySets();
  }, [categoryFilter, sortBy]);

  const fetchStudySets = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/studysets/public?category=${categoryFilter}&sort=${sortBy}`
      );

      if (response.ok) {
        const data = await response.json();
        setStudySets(data.studySets || []);
      }
    } catch (error) {
      console.error("Failed to fetch public study sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudySets = studySets.filter((studySet) =>
    studySet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    studySet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    studySet.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = Array.from(new Set(studySets.map((s) => s.category)));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publieke Studie Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Publieke Studie Sets</h2>
        <Badge variant="secondary">{studySets.length} sets</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek studie sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Select value={sortBy} onValueChange={(value: "popular" | "recent" | "rating") => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Populair</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="rating">Hoogste Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showFilters && (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Categorieën</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudySets.map((studySet) => (
          <Card
            key={studySet.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onStudySetClick?.(studySet.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg line-clamp-2">{studySet.title}</CardTitle>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{Math.round(studySet.rating * 10) / 10}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{studySet.author.name}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {studySet.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {studySet.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {studySet.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{studySet.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm pt-3 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{studySet.termCount} kaarten</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span>{studySet.downloads}</span>
                  </div>
                </div>
                <Badge variant="outline">{studySet.category}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudySets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen Studie Sets</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== "all"
                ? "Probeer andere filters"
                : "Er zijn nog geen openbare studie sets beschikbaar"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
