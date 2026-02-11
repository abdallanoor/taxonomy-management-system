"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface Category {
  _id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

// Flatten all categories with their paths for search
function flattenCategories(
  cats: Category[],
  path: Category[] = [],
): { category: Category; path: Category[] }[] {
  const result: { category: Category; path: Category[] }[] = [];
  for (const cat of cats) {
    result.push({ category: cat, path });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, [...path, cat]));
    }
  }
  return result;
}

// Find category and its path in the tree
function findCategoryPath(
  cats: Category[],
  targetId: string,
  path: Category[] = [],
): { category: Category; path: Category[] } | null {
  for (const cat of cats) {
    if (cat._id === targetId) {
      return { category: cat, path };
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryPath(cat.children, targetId, [...path, cat]);
      if (found) return found;
    }
  }
  return null;
}

interface CascadingCategorySelectorProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CascadingCategorySelector({
  categories,
  value,
  onChange,
  placeholder = "اختر التصنيف...",
  disabled = false,
}: CascadingCategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [navigationStack, setNavigationStack] = React.useState<Category[][]>([
    categories,
  ]);
  const [pathStack, setPathStack] = React.useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Flatten all categories with their paths for search
  const allCategories = React.useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  // Filter categories based on search
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allCategories.filter(({ category }) =>
      category.name.toLowerCase().includes(query),
    );
  }, [searchQuery, allCategories]);

  const isSearching = searchQuery.trim().length > 0;

  // Restore navigation to selected category when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && value && categories.length > 0) {
      const result = findCategoryPath(categories, value);
      if (result && result.path.length > 0) {
        // Build navigation stack from path
        const navStack: Category[][] = [categories];
        for (const cat of result.path) {
          if (cat.children && cat.children.length > 0) {
            navStack.push(cat.children);
          }
        }
        setNavigationStack(navStack);
        setPathStack(result.path);
      } else {
        // Reset to root if no path found
        setNavigationStack([categories]);
        setPathStack([]);
      }
    }
    if (!isOpen) {
      setSearchQuery("");
    }
    setOpen(isOpen);
  };

  // Reset navigation when categories change
  React.useEffect(() => {
    setNavigationStack([categories]);
    setPathStack([]);
  }, [categories]);

  const currentLevel = navigationStack[navigationStack.length - 1];

  const navigateInto = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setNavigationStack([...navigationStack, category.children]);
      setPathStack([...pathStack, category]);
    }
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(navigationStack.slice(0, -1));
      setPathStack(pathStack.slice(0, -1));
    }
  };

  const selectCategory = (category: Category) => {
    onChange(category._id);
    setOpen(false);
    setSearchQuery("");
  };

  const getSelectedCategoryPath = (): string => {
    if (!value) return "";

    const findPath = (
      cats: Category[],
      path: string[] = [],
    ): string[] | null => {
      for (const cat of cats) {
        if (cat._id === value) {
          return [...path, cat.name];
        }
        if (cat.children) {
          const found = findPath(cat.children, [...path, cat.name]);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPath(categories);
    return path ? path.join(" > ") : "";
  };

  const selectedPath = getSelectedCategoryPath();

  // Reset navigation and search when value becomes null (external clear)
  React.useEffect(() => {
    if (!value) {
      setNavigationStack([categories]);
      setPathStack([]);
      setSearchQuery("");
    }
  }, [value, categories]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate flex-1 text-start min-w-0">
            {selectedPath || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="opacity-50 hover:opacity-100 cursor-pointer"
                title="إعادة تعيين"
              >
                <HugeiconsIcon icon={ReloadIcon} className="h-4 w-4" />
              </div>
            )}
            {!value && (
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={cn(
                  "h-4 w-4 shrink-0 opacity-50 transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="ابحث عن التصنيف..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          {/* Breadcrumb navigation - hide when searching */}
          {!isSearching && pathStack.length > 0 && (
            <div className="flex items-center gap-1 p-2 border-b flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={navigateBack}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                رجوع
              </Button>
              <div className="flex items-center gap-1 flex-wrap">
                {pathStack.map((cat, idx) => (
                  <React.Fragment key={cat._id}>
                    {idx > 0 && (
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={12}
                        className="text-muted-foreground"
                      />
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <CommandList>
            <CommandEmpty>لا توجد تصنيفات</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[250px]">
                {/* Show search results when searching */}
                {isSearching
                  ? searchResults.map(({ category, path }) => (
                      <CommandItem
                        key={category._id}
                        value={category._id}
                        onSelect={() => selectCategory(category)}
                        className="flex flex-col items-start gap-1 cursor-pointer py-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={16}
                            className={cn(
                              "text-primary shrink-0",
                              value === category._id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        {path.length > 0 && (
                          <div className="flex items-center gap-1 mr-6 text-xs text-muted-foreground flex-wrap">
                            {path.map((p, idx) => (
                              <React.Fragment key={p._id}>
                                {idx > 0 && <span>›</span>}
                                <span>{p.name}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </CommandItem>
                    ))
                  : /* Show current level navigation when not searching */
                    currentLevel.map((category) => (
                      <CommandItem
                        key={category._id}
                        value={category._id}
                        onSelect={() => {
                          if (
                            category.children &&
                            category.children.length > 0
                          ) {
                            navigateInto(category);
                          } else {
                            selectCategory(category);
                          }
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={16}
                            className={cn(
                              "text-primary",
                              value === category._id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span>{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {category.children &&
                            category.children.length > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {category.children.length} فرعي
                                </span>
                                <HugeiconsIcon
                                  icon={ArrowLeft01Icon}
                                  size={14}
                                  className="text-muted-foreground"
                                />
                              </>
                            )}
                          {(!category.children ||
                            category.children.length === 0) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectCategory(category);
                              }}
                            >
                              اختيار
                            </Button>
                          )}
                        </div>
                      </CommandItem>
                    ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>

          {/* Allow selecting parent categories with children - hide when searching */}
          {!isSearching && pathStack.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const lastCategory = pathStack[pathStack.length - 1];
                  selectCategory(lastCategory);
                }}
              >
                اختيار &quot;{pathStack[pathStack.length - 1]?.name}&quot;
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
