'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, BookOpen, FileText, Calendar, Tag } from 'lucide-react';

interface ContentSearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: ContentFilters) => void;
  onReset: () => void;
}

export interface ContentFilters {
  type?: string;
  category?: string;
  dateRange?: string;
  tags?: string[];
}

export function ContentSearchFilter({ onSearch, onFilter, onReset }: ContentSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ContentFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof ContentFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilters({});
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Zoek en Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek content..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter((v) => v !== undefined && v !== '').length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Type
              </label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Types</SelectItem>
                  <SelectItem value="studyset">Studie Sets</SelectItem>
                  <SelectItem value="homework">Huiswerk</SelectItem>
                  <SelectItem value="event">Evenementen</SelectItem>
                  <SelectItem value="note">Notities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categorie
              </label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('category', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Categorieën</SelectItem>
                  <SelectItem value="math">Wiskunde</SelectItem>
                  <SelectItem value="physics">Natuurkunde</SelectItem>
                  <SelectItem value="chemistry">Scheikunde</SelectItem>
                  <SelectItem value="biology">Biologie</SelectItem>
                  <SelectItem value="history">Geschiedenis</SelectItem>
                  <SelectItem value="language">Talen</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tijdperiode
              </label>
              <Select
                value={filters.dateRange || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('dateRange', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Tijden</SelectItem>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="week">Deze Week</SelectItem>
                  <SelectItem value="month">Deze Maand</SelectItem>
                  <SelectItem value="year">Dit Jaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {['exam', 'practice', 'review', 'important', 'draft'].map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentTags = filters.tags || [];
                      const newTags = currentTags.includes(tag)
                        ? currentTags.filter((t) => t !== tag)
                        : [...currentTags, tag];
                      handleFilterChange('tags', newTags.join(','));
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
