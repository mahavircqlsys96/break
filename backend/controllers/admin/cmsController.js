const { cms } = require("../../models");

const helper = require('../../helpers/helper');
module.exports = {
    listCms: async (req, res) => {
        try {
            const data = await cms.findAll();
            return helper.success(res, "CMS list retrieved successfully", data);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Something went wrong");
        }
    },
    getCms: async (req, res) => {
        try {
            const type = req.params.slug;

            const data = await cms.findOne({ where: { slug: type } });
            if (!data) {
                return res.status(404).json({ message: "data not found" });
            }
            return helper.success(res, "CMS retrieved successfully", data);
        } catch (error) {
            console.log(error)
            return helper.failed(res, "Something went wrong");
        }
    },

    updateCms: async (req, res) => {
        try {
            const { slug, title, content } = req.body;
            const imageFile = req.files && req.files?.image || undefined;
            const cmsContent = await cms.findOne({ where: { slug: slug } });
            if (!cmsContent) {
                return res.status(404).json({ message: "data not found" });
            }
            let updatedData = { title, content };
            if (imageFile && slug === "help_support") {
                const folderName = "users"
                const fileUploader = await helper.fileUpload(imageFile, folderName);
                updatedData.content = fileUploader;
            } else if (!imageFile && slug === "help_support") {
                updatedData.content = cmsContent.content;
            }
            await cms.update(updatedData, { where: { slug: slug } })
            return helper.success(res, "cms updated");
        } catch (error) {
            console.log(error)
            return helper.failed(res, "Something went wrong");
        }
    },

}