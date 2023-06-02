use std::vec;

use convert_case::{Case, Casing};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use swc_core::ecma::{
    ast::{
        ImportDecl, ImportDefaultSpecifier, ImportSpecifier, JSXAttrName, JSXAttrOrSpread,
        JSXAttrValue, JSXElement, JSXElementName::Ident, Lit, Module, ModuleDecl, ModuleItem,
        Program, Stmt,
    },
    visit::{as_folder, swc_ecma_ast, FoldWith, VisitMut, VisitMutWith},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    /// Tag name to be transformed.
    #[serde(default = "config_default_tag_name")]
    pub tag_name: String,

    /// Icon attribute name.
    #[serde(default = "config_default_icon_attribute_name")]
    pub icon_attribute_name: String,

    /// Icon component prefix.
    #[serde(default = "config_default_icon_component_prefix")]
    pub icon_component_prefix: String,

    /// Import prefix.
    #[serde(default = "config_default_import_prefix")]
    pub import_prefix: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            tag_name: config_default_tag_name(),
            icon_attribute_name: config_default_icon_attribute_name(),
            icon_component_prefix: config_default_icon_component_prefix(),
            import_prefix: config_default_import_prefix(),
        }
    }
}

fn config_default_tag_name() -> String {
    "i".to_string()
}
fn config_default_icon_attribute_name() -> String {
    "icon".to_string()
}
fn config_default_icon_component_prefix() -> String {
    "Icon".to_string()
}
fn config_default_import_prefix() -> String {
    ".@achamaro/swc-plugin-icon/".to_string()
}

pub struct TransformVisitor {
    config: Config,
    icons: IndexMap<String, String>,
}

impl TransformVisitor {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            icons: IndexMap::new(),
        }
    }

    fn icon_component_name(&self, icon_name: &str) -> String {
        self.config.icon_component_prefix.to_string()
            + icon_name.replace(":", "_").to_case(Case::Pascal).as_str()
    }
}

impl VisitMut for TransformVisitor {
    // Implement necessary visit_mut_* methods for actual custom transform.
    // A comprehensive list of possible visitor methods can be found here:
    // https://rustdoc.swc.rs/swc_ecma_visit/trait.VisitMut.html

    fn visit_mut_module(&mut self, n: &mut Module) {
        n.visit_mut_children_with(self);

        // アイコンコンポーネントのインポートを追加
        if self.icons.len() > 0 {
            // 先頭、または `ExpressionStatement` （"use client";）の後に追加する
            let mut index = 0;
            for item in n.body.iter() {
                if let ModuleItem::Stmt(Stmt::Expr(_)) = item {
                    index += 1;
                } else {
                    break;
                }
            }

            for (icon_name, icon_component_name) in &self.icons {
                let item = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
                    span: Default::default(),
                    specifiers: vec![ImportSpecifier::Default(ImportDefaultSpecifier {
                        span: Default::default(),
                        local: swc_ecma_ast::Ident::new(
                            icon_component_name.clone().into(),
                            Default::default(),
                        ),
                    })],
                    src: Box::new(
                        (self.config.import_prefix.to_string()
                            + icon_name.replace(":", "/").as_str())
                        .into(),
                    ),
                    type_only: false,
                    asserts: None,
                }));

                n.body.insert(index, item);
            }
        }
    }

    fn visit_mut_jsx_element(&mut self, n: &mut JSXElement) {
        // 指定のタグがアイコン属性を持つ場合に、アイコンコンポーネントに置き換える
        if let Ident(opening_name) = &mut n.opening.name {
            if opening_name.sym == self.config.tag_name {
                for attr_or_spread in &n.opening.attrs {
                    if let JSXAttrOrSpread::JSXAttr(attr) = attr_or_spread {
                        if let JSXAttrName::Ident(id) = &attr.name {
                            if id.sym == self.config.icon_attribute_name {
                                if let Option::Some(JSXAttrValue::Lit(Lit::Str(icon_name))) =
                                    &attr.value
                                {
                                    let icon_name = icon_name.value.to_string();

                                    // アイコンコンポーネントに置き換え
                                    let icon_component_name = self.icon_component_name(&icon_name);

                                    // 開始タグ
                                    opening_name.sym = icon_component_name.clone().into();

                                    // 終了タグ
                                    if let Some(closing_name) = &mut n.closing {
                                        if let Ident(closing_name) = &mut closing_name.name {
                                            closing_name.sym = icon_component_name.clone().into();
                                        }
                                    }

                                    // アイコン名を追加
                                    self.icons.insert(icon_name, icon_component_name);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }

        n.visit_mut_children_with(self);
    }
}

/// An example plugin function with macro support.
/// `plugin_transform` macro interop pointers into deserialized structs, as well
/// as returning ptr back to host.
///
/// It is possible to opt out from macro by writing transform fn manually
/// if plugin need to handle low-level ptr directly via
/// `__transform_plugin_process_impl(
///     ast_ptr: *const u8, ast_ptr_len: i32,
///     unresolved_mark: u32, should_enable_comments_proxy: i32) ->
///     i32 /*  0 for success, fail otherwise.
///             Note this is only for internal pointer interop result,
///             not actual transform result */`
///
/// This requires manual handling of serialization / deserialization from ptrs.
/// Refer swc_plugin_macro to see how does it work internally.
#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config: Config = serde_json::from_str::<Config>(
        &metadata
            .get_transform_plugin_config()
            .expect("failed to parse plugin config"),
    )
    .unwrap_or_default();

    program.fold_with(&mut as_folder(TransformVisitor::new(config)))
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use swc_core::ecma::visit::as_folder;
    use swc_ecma_parser::{Syntax, TsConfig};
    use swc_ecma_transforms_testing::{test, test_fixture};
    use testing::fixture;

    use crate::{Config, TransformVisitor};

    #[fixture("tests/fixture/**/input.tsx")]
    fn fixture(input: PathBuf) {
        let output = input.with_file_name("output.tsx");
        test_fixture(
            Syntax::Typescript(TsConfig {
                tsx: input.to_string_lossy().ends_with(".tsx"),
                ..Default::default()
            }),
            &|_| as_folder(TransformVisitor::new(Config::default())),
            &input,
            &output,
            Default::default(),
        );
    }
}
